import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getPayload } from 'payload'

import { buildSeedContent } from './seed-content'
import { buildPayloadDryRun } from './seed-dry-run'
import { travelOnlySeedContent } from './seed-scope'
import {
  buildTravelConflictRegister,
  writeTravelConflictRegister,
} from './travel-conflict-register'

async function run() {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('TRAVEL_READBACK_TIMEOUT')), 120_000)
  })
  const report = await Promise.race([readback(), timeout])
  const conflictRegister = buildTravelConflictRegister(report.actions, {
    '202702-thailand-phuket:sourceSections[item-1c51hpg].links': 'payload-wins',
  })
  const artifactPath = process.argv.includes('--write-conflict-register')
    ? await writeTravelConflictRegister({
        artifactRoot: path.join(process.cwd(), 'docs/phase-artifacts/phase-17'),
        entries: conflictRegister,
      })
    : undefined

  console.log(
    JSON.stringify(
      {
        summary: report.summary,
        travels: report.actions
          .filter(
            (action) =>
              action.collection === 'travel-plans' || action.collection === 'travel-memories',
          )
          .map((action) => ({
            slug: action.key,
            action: action.action,
            conflicts: action.conflicts?.map(({ field, category }) => ({ field, category })),
            changes: action.conflicts?.map(({ field, base, source, current }) => ({
              field,
              sourceChangedPaths: changedPaths(base, source).slice(0, 30),
              currentChangedPaths: changedPaths(base, current).slice(0, 30),
            })),
          })),
        totalActions: report.actions.length,
        conflictRegister,
        artifactPath,
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

function changedPaths(left: unknown, right: unknown, prefix = '$'): string[] {
  if (JSON.stringify(left) === JSON.stringify(right)) return []

  if (Array.isArray(left) && Array.isArray(right)) {
    return Array.from({ length: Math.max(left.length, right.length) }).flatMap((_, index) =>
      changedPaths(left[index], right[index], `${prefix}[${index}]`),
    )
  }

  if (isRecord(left) && isRecord(right)) {
    return [...new Set([...Object.keys(left), ...Object.keys(right)])].flatMap((key) =>
      changedPaths(left[key], right[key], `${prefix}.${key}`),
    )
  }

  return [prefix]
}

async function readback() {
  const root = process.cwd()
  await loadLocalEnv(root)
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const seedContent = travelOnlySeedContent(await buildSeedContent(root))
  return buildPayloadDryRun(payload, seedContent, 'safe', (message) => {
    console.error(`[READBACK-PROBE] ${message}`)
  })
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
