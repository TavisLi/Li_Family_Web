import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { sql, type MigrateUpArgs } from '@payloadcms/db-postgres'
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import { buildSeedContent } from './seed-content'
import {
  buildTravelMemoryDayProjections,
  type TravelMemoryDaySourceProjection,
} from './travel-memory-day-projections'
import { buildTravelProjection, travelProjectionHash, type TravelProjection } from './travel-seed-reconciliation'
import type { TravelMemoryDay } from '@/payload/payload-types'

const travelSlug = '202602-thailand-phuket'
const expectedMemoryId = 3
const expectedDays = 8
const expectedAppendMoments = 34
const expectedAppendPhotos = 42
const expectedYoutubePlacements = 10
const confirmationText =
  'append 34 photo moments / 42 photos to existing 202602-thailand-phuket days, preserve 10 youtube placements'

type TravelMemoryDayMoment = NonNullable<TravelMemoryDay['moments']>[number]
type TravelMemoryDayPlacement = NonNullable<TravelMemoryDayMoment['placements']>[number]
type TransactionDatabase = MigrateUpArgs['db']
type LocalReq = Awaited<ReturnType<typeof createLocalReq>>

type PhotoMomentPlan = {
  momentKey: string
  time?: string
  location?: string
  title: string
  body?: string
  placements: PhotoPlacementPlan[]
}

type PhotoPlacementPlan = {
  placementKey: string
  media: number
  sourcePath: string
  caption?: string
}

type DayAppendPlan = {
  id: number
  dayIdentity: string
  dayKey: string
  day: number
  title: string
  currentMoments: number
  currentYoutubePlacements: number
  currentPhotoPlacements: number
  appendMoments: PhotoMomentPlan[]
  appendPhotos: number
}

type AppendState = {
  memory: {
    id: number
    slug: string
    status?: string | null
    presentationStyle?: string | null
  }
  unmatchedMedia: string[]
  unassignedVideos: { title?: string; youtubeUrl: string }[]
  dayPlans: DayAppendPlan[]
  totals: {
    days: number
    currentYoutubePlacements: number
    currentPhotoPlacements: number
    appendMoments: number
    appendPhotos: number
  }
}

async function run() {
  const mode = process.argv[2]
  if (mode !== 'inspect' && mode !== 'apply' && mode !== 'verify') {
    throw new Error('Usage: phase19-phuket-photo-append.ts <inspect|apply|verify> [--allow-write]')
  }

  const root = process.cwd()
  await loadLocalEnv(root)
  if (process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true') {
    throw new Error('Phuket photo append refuses PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true')
  }
  process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'
  if (!process.env.DATABASE_URI) throw new Error('DATABASE_URI is required')

  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })

  try {
    if (mode === 'verify') {
      const readback = await collectState(payload, root)
      assertReadback(readback)
      console.log(JSON.stringify({ mode, verified: true, ...summarizeState(readback) }, null, 2))
      return
    }

    const state = await collectState(payload, root)
    assertPreconditions(state)
    const approvalToken = buildApprovalToken(state)

    if (mode === 'inspect') {
      console.log(JSON.stringify({
        mode,
        approvalToken,
        confirmationText,
        ...summarizeState(state),
        writeCommand:
          `PHUKET_PHOTO_APPEND_CONFIRM='${approvalToken}' PHUKET_PHOTO_APPEND_TEXT='${confirmationText}' pnpm exec tsx src/scripts/phase19-phuket-photo-append.ts apply --allow-write`,
      }, null, 2))
      return
    }

    assertWriteApproval(approvalToken)

    const req = await createLocalReq({}, payload)
    if (!(await initTransaction(req))) {
      throw new Error('Phuket photo append could not start an isolated transaction')
    }

    try {
      const db = await transactionDatabase(payload, req)
      await db.execute(sql.raw(`
        lock table
          travel_memories,
          travel_memory_days,
          travel_memory_days_moments,
          travel_memory_days_moments_placements,
          media
        in share row exclusive mode
      `))

      const transactionState = await collectState(payload, root, req)
      assertPreconditions(transactionState)
      const transactionToken = buildApprovalToken(transactionState)
      if (transactionToken !== approvalToken) {
        throw new Error('Phuket photo append state changed after approval; transaction refused')
      }

      for (const plan of transactionState.dayPlans) {
        const currentDay = await requiredDay(payload, plan.id, req)
        const mergedMoments = [
          ...(currentDay.moments ?? []),
          ...plan.appendMoments.map(materializePhotoMoment),
        ]
        assertYoutubePreserved(currentDay.moments ?? [], mergedMoments, plan.dayIdentity)
        assertNoDuplicateKeys(mergedMoments, plan.dayIdentity)

        const projection = buildTravelProjection({
          dayKey: currentDay.dayKey,
          day: currentDay.day,
          date: currentDay.date,
          dateLabel: currentDay.dateLabel,
          title: currentDay.title,
          theme: currentDay.theme,
          story: currentDay.story,
          moments: mergedMoments,
          meals: currentDay.meals,
          lodging: currentDay.lodging,
        })

        await payload.update({
          collection: 'travel-memory-days',
          id: plan.id,
          data: {
            moments: mergedMoments,
            sourceMetadata: {
              ...(currentDay.sourceMetadata ?? {}),
              parserVersion: 'phase-19-phuket-photo-append-v1',
              sourceHash: travelProjectionHash(projection),
              lastImportedAt: new Date().toISOString(),
              baseProjection: projection,
            },
          },
          overrideAccess: true,
          req,
        })
      }

      const readback = await collectState(payload, root, req)
      assertReadback(readback)
      await commitTransaction(req)
      console.log(JSON.stringify({ mode, committed: true, ...summarizeState(readback) }, null, 2))
    } catch (error) {
      await killTransaction(req)
      throw error
    }
  } finally {
    await payload.destroy()
  }
}

async function collectState(payload: Payload, root: string, req?: LocalReq): Promise<AppendState> {
  const seedContent = await buildSeedContent(root)
  const travel = seedContent.travels.find((item) => item.slug === travelSlug)
  if (!travel) throw new Error(`Missing source travel: ${travelSlug}`)

  const memoryResult = await payload.find({
    collection: 'travel-memories',
    where: { slug: { equals: travelSlug } },
    limit: 2,
    overrideAccess: true,
    req,
  })
  if (memoryResult.docs.length !== 1) {
    throw new Error(`Expected exactly one travel memory for ${travelSlug}, got ${memoryResult.docs.length}`)
  }
  const memory = memoryResult.docs[0]
  if (!memory) throw new Error(`Missing travel memory for ${travelSlug}`)

  const projection = buildTravelMemoryDayProjections(travel, seedContent.media)
  const photoSourcePaths = [...new Set(
    projection.days.flatMap((day) =>
      day.moments.flatMap((moment) =>
        moment.placements.flatMap((placement) =>
          placement.type === 'photo' && placement.mediaSourcePath ? [placement.mediaSourcePath] : [],
        ),
      ),
    ),
  )].sort()

  const mediaIdsBySourcePath = await findMediaIds(payload, photoSourcePaths, req)
  const missingMedia = photoSourcePaths.filter((sourcePath) => !mediaIdsBySourcePath.has(sourcePath))
  if (missingMedia.length) {
    throw new Error(`Missing Production Media records: ${missingMedia.join(', ')}`)
  }

  const dayResult = await payload.find({
    collection: 'travel-memory-days',
    where: { memory: { equals: memory.id } },
    limit: 20,
    sort: 'day',
    overrideAccess: true,
    req,
  })
  const daysByKey = new Map(dayResult.docs.map((day) => [day.dayKey, day]))

  const dayPlans = projection.days.map((day) =>
    buildDayPlan({
      source: day,
      current: daysByKey.get(day.dayKey),
      memoryId: Number(memory.id),
      mediaIdsBySourcePath,
    }),
  )

  const state: AppendState = {
    memory: {
      id: Number(memory.id),
      slug: memory.slug,
      status: memory._status,
      presentationStyle: memory.presentationStyle,
    },
    unmatchedMedia: projection.unmatchedMedia,
    unassignedVideos: projection.unassignedVideos,
    dayPlans,
    totals: {
      days: dayPlans.length,
      currentYoutubePlacements: dayPlans.reduce((sum, day) => sum + day.currentYoutubePlacements, 0),
      currentPhotoPlacements: dayPlans.reduce((sum, day) => sum + day.currentPhotoPlacements, 0),
      appendMoments: dayPlans.reduce((sum, day) => sum + day.appendMoments.length, 0),
      appendPhotos: dayPlans.reduce((sum, day) => sum + day.appendPhotos, 0),
    },
  }
  return state
}

async function findMediaIds(payload: Payload, sourcePaths: string[], req?: LocalReq) {
  const mediaIdsBySourcePath = new Map<string, number>()
  for (const sourcePath of sourcePaths) {
    const result = await payload.find({
      collection: 'media',
      where: { sourcePath: { equals: sourcePath } },
      limit: 2,
      overrideAccess: true,
      req,
    })
    if (result.docs.length > 1) {
      throw new Error(`Duplicate Production Media sourcePath: ${sourcePath}`)
    }
    const doc = result.docs[0]
    if (doc) mediaIdsBySourcePath.set(sourcePath, Number(doc.id))
  }
  return mediaIdsBySourcePath
}

function buildDayPlan(input: {
  source: TravelMemoryDaySourceProjection
  current?: TravelMemoryDay
  memoryId: number
  mediaIdsBySourcePath: Map<string, number>
}): DayAppendPlan {
  const expectedIdentity = `${input.memoryId}:${input.source.dayKey}`
  if (!input.current) throw new Error(`Missing Production day: ${expectedIdentity}`)
  if (input.current.dayIdentity !== expectedIdentity) {
    throw new Error(`Unexpected day identity for ${input.source.dayKey}: ${input.current.dayIdentity}`)
  }

  const existingMomentKeys = new Set((input.current.moments ?? []).map((moment) => moment.momentKey))
  const existingPlacementKeys = new Set(
    (input.current.moments ?? []).flatMap((moment) =>
      (moment.placements ?? []).flatMap((placement) =>
        placement.placementKey ? [placement.placementKey] : [],
      ),
    ),
  )
  const appendMoments = input.source.moments.flatMap<PhotoMomentPlan>((moment) => {
    const photoPlacements = moment.placements.filter((placement) => placement.type === 'photo')
    if (!photoPlacements.length) return []
    if (existingMomentKeys.has(moment.momentKey)) {
      const alreadyPresent = photoPlacements.every((placement) =>
        existingPlacementKeys.has(placement.placementKey),
      )
      if (alreadyPresent) return []
      throw new Error(`Refusing partial duplicate momentKey in ${expectedIdentity}: ${moment.momentKey}`)
    }

    return [{
      momentKey: moment.momentKey,
      ...(moment.time ? { time: moment.time } : {}),
      ...(moment.location ? { location: moment.location } : {}),
      title: moment.title,
      ...(moment.body ? { body: moment.body } : {}),
      placements: photoPlacements.map((placement) => {
        const sourcePath = placement.mediaSourcePath
        if (!sourcePath) throw new Error(`Photo placement missing sourcePath in ${expectedIdentity}`)
        const media = input.mediaIdsBySourcePath.get(sourcePath)
        if (!media) throw new Error(`Photo placement missing media id in ${expectedIdentity}: ${sourcePath}`)
        return {
          placementKey: placement.placementKey,
          media,
          sourcePath,
          ...(placement.caption ? { caption: placement.caption } : {}),
        }
      }),
    }]
  })

  for (const moment of appendMoments) {
    for (const placement of moment.placements) {
      if (existingPlacementKeys.has(placement.placementKey)) {
        throw new Error(`Refusing duplicate placementKey in ${expectedIdentity}: ${placement.placementKey}`)
      }
    }
  }

  return {
    id: Number(input.current.id),
    dayIdentity: input.current.dayIdentity,
    dayKey: input.current.dayKey,
    day: input.current.day,
    title: String(input.current.title),
    currentMoments: (input.current.moments ?? []).length,
    currentYoutubePlacements: countYoutubePlacements(input.current.moments ?? []),
    currentPhotoPlacements: countPhotoPlacements(input.current.moments ?? []),
    appendMoments,
    appendPhotos: appendMoments.reduce((sum, moment) => sum + moment.placements.length, 0),
  }
}

function materializePhotoMoment(moment: PhotoMomentPlan): TravelMemoryDayMoment {
  return {
    momentKey: moment.momentKey,
    time: moment.time,
    location: moment.location,
    title: moment.title,
    body: moment.body,
    placements: moment.placements.map<TravelMemoryDayPlacement>((placement) => ({
      placementKey: placement.placementKey,
      type: 'photo',
      role: 'inline',
      media: placement.media,
      caption: placement.caption,
    })),
  }
}

async function requiredDay(payload: Payload, id: number, req: LocalReq) {
  return payload.findByID({
    collection: 'travel-memory-days',
    id,
    overrideAccess: true,
    req,
  })
}

function assertPreconditions(state: AppendState) {
  const errors = [
    state.memory.id === expectedMemoryId ? undefined : `memory id expected ${expectedMemoryId}, got ${state.memory.id}`,
    state.memory.slug === travelSlug ? undefined : `memory slug expected ${travelSlug}, got ${state.memory.slug}`,
    state.memory.status === 'published' ? undefined : `memory status expected published, got ${state.memory.status}`,
    state.memory.presentationStyle === 'editorial-journal'
      ? undefined
      : `presentationStyle expected editorial-journal, got ${state.memory.presentationStyle}`,
    state.unmatchedMedia.length === 0 ? undefined : `unmatchedMedia: ${state.unmatchedMedia.join(', ')}`,
    state.unassignedVideos.length === 0 ? undefined : `unassignedVideos: ${state.unassignedVideos.length}`,
    state.totals.days === expectedDays ? undefined : `days expected ${expectedDays}, got ${state.totals.days}`,
    state.totals.currentYoutubePlacements === expectedYoutubePlacements
      ? undefined
      : `youtube placements expected ${expectedYoutubePlacements}, got ${state.totals.currentYoutubePlacements}`,
    state.totals.currentPhotoPlacements === 0
      ? undefined
      : `current photo placements expected 0 before append, got ${state.totals.currentPhotoPlacements}`,
    state.totals.appendMoments === expectedAppendMoments
      ? undefined
      : `append moments expected ${expectedAppendMoments}, got ${state.totals.appendMoments}`,
    state.totals.appendPhotos === expectedAppendPhotos
      ? undefined
      : `append photos expected ${expectedAppendPhotos}, got ${state.totals.appendPhotos}`,
  ].filter((message): message is string => Boolean(message))

  for (let day = 1; day <= expectedDays; day += 1) {
    const key = `day-${String(day).padStart(2, '0')}`
    const plan = state.dayPlans.find((item) => item.dayKey === key)
    if (!plan) errors.push(`missing plan for ${key}`)
    if (plan && plan.dayIdentity !== `${expectedMemoryId}:${key}`) {
      errors.push(`unexpected identity for ${key}: ${plan.dayIdentity}`)
    }
  }

  if (errors.length) throw new Error(`Phuket photo append precondition failed:\n- ${errors.join('\n- ')}`)
}

function assertReadback(state: AppendState) {
  const errors = [
    state.memory.id === expectedMemoryId ? undefined : `memory id expected ${expectedMemoryId}, got ${state.memory.id}`,
    state.totals.days === expectedDays ? undefined : `days expected ${expectedDays}, got ${state.totals.days}`,
    state.totals.currentYoutubePlacements === expectedYoutubePlacements
      ? undefined
      : `youtube placements expected ${expectedYoutubePlacements}, got ${state.totals.currentYoutubePlacements}`,
    state.totals.currentPhotoPlacements === expectedAppendPhotos
      ? undefined
      : `photo placement readback expected ${expectedAppendPhotos}, got ${state.totals.currentPhotoPlacements}`,
  ].filter((message): message is string => Boolean(message))

  if (state.totals.appendMoments !== 0 || state.totals.appendPhotos !== 0) {
    errors.push(
      `append should be idempotent after apply; remaining moments/photos ${state.totals.appendMoments}/${state.totals.appendPhotos}`,
    )
  }

  if (errors.length) throw new Error(`Phuket photo append readback failed:\n- ${errors.join('\n- ')}`)
}

function buildApprovalToken(state: AppendState) {
  return createHash('sha256')
    .update(JSON.stringify({
      memory: state.memory,
      dayIds: state.dayPlans.map((day) => [day.dayKey, day.id, day.dayIdentity, day.currentYoutubePlacements]),
      totals: state.totals,
      placementKeys: state.dayPlans.flatMap((day) =>
        day.appendMoments.flatMap((moment) => moment.placements.map((placement) => placement.placementKey)),
      ),
    }))
    .digest('hex')
    .slice(0, 16)
}

function assertWriteApproval(approvalToken: string) {
  if (!process.argv.includes('--allow-write')) {
    throw new Error('Missing --allow-write')
  }
  if (process.env.PHUKET_PHOTO_APPEND_CONFIRM !== approvalToken) {
    throw new Error('PHUKET_PHOTO_APPEND_CONFIRM does not match current approval token')
  }
  if (process.env.PHUKET_PHOTO_APPEND_TEXT !== confirmationText) {
    throw new Error('PHUKET_PHOTO_APPEND_TEXT does not match required confirmation text')
  }
}

function summarizeState(state: AppendState) {
  return {
    memory: state.memory,
    totals: state.totals,
    days: state.dayPlans.map((day) => ({
      id: day.id,
      dayIdentity: day.dayIdentity,
      dayKey: day.dayKey,
      currentMoments: day.currentMoments,
      currentYoutubePlacements: day.currentYoutubePlacements,
      currentPhotoPlacements: day.currentPhotoPlacements,
      appendMoments: day.appendMoments.length,
      appendPhotos: day.appendPhotos,
      momentKeys: day.appendMoments.map((moment) => moment.momentKey),
    })),
  }
}

function countYoutubePlacements(moments: TravelMemoryDayMoment[]) {
  return moments.reduce(
    (sum, moment) =>
      sum + (moment.placements ?? []).filter((placement) => placement.type === 'youtube').length,
    0,
  )
}

function countPhotoPlacements(moments: TravelMemoryDayMoment[]) {
  return moments.reduce(
    (sum, moment) =>
      sum + (moment.placements ?? []).filter((placement) => placement.type === 'photo').length,
    0,
  )
}

function assertYoutubePreserved(
  before: TravelMemoryDayMoment[],
  after: TravelMemoryDayMoment[],
  dayIdentity: string,
) {
  const beforeYoutube = youtubeSignature(before)
  const afterYoutube = youtubeSignature(after)
  if (JSON.stringify(beforeYoutube) !== JSON.stringify(afterYoutube)) {
    throw new Error(`YouTube placements changed in ${dayIdentity}`)
  }
}

function youtubeSignature(moments: TravelMemoryDayMoment[]) {
  return moments.flatMap((moment) =>
    (moment.placements ?? [])
      .filter((placement) => placement.type === 'youtube')
      .map((placement) => ({
        momentKey: moment.momentKey,
        placementKey: placement.placementKey,
        youtubeUrl: placement.youtubeUrl,
        caption: placement.caption,
      })),
  )
}

function assertNoDuplicateKeys(moments: TravelMemoryDayMoment[], dayIdentity: string) {
  const momentKeys = moments.map((moment) => moment.momentKey).filter(Boolean)
  if (new Set(momentKeys).size !== momentKeys.length) {
    throw new Error(`Duplicate moment keys in ${dayIdentity}`)
  }

  for (const moment of moments) {
    const placementKeys = (moment.placements ?? []).map((placement) => placement.placementKey).filter(Boolean)
    if (new Set(placementKeys).size !== placementKeys.length) {
      throw new Error(`Duplicate placement keys in ${dayIdentity}:${moment.momentKey}`)
    }
  }
}

async function transactionDatabase(payload: Payload, req: LocalReq) {
  const transactionID = await req.transactionID
  const adapter = payload.db as unknown as { sessions?: Record<string, { db?: TransactionDatabase }> }
  const db = transactionID ? adapter.sessions?.[transactionID]?.db : undefined
  if (!db) throw new Error('Phuket photo append transaction session is unavailable')
  return db
}

async function loadLocalEnv(root: string) {
  for (const filename of ['.env.local', '.env']) {
    try {
      const content = await readFile(path.join(root, filename), 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const separatorIndex = trimmed.indexOf('=')
        if (separatorIndex === -1) continue

        const key = trimmed.slice(0, separatorIndex).trim()
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
        if (key && process.env[key] === undefined) process.env[key] = value
      }
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') throw error
    }
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
