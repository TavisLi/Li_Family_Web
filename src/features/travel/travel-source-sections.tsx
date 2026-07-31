import React, { Suspense } from 'react'
import type { ReactNode } from 'react'
import { Image as ImageIcon, Video } from 'lucide-react'

import type { TravelInteractionThread } from '@/lib/data/travel'
import { PayloadImage } from '@/components/ui/payload-image'
import type { TravelRuntimeRecord, TravelRuntimeSection } from '@/lib/travel-runtime'
import type { Media } from '@/payload/payload-types'
import { toYouTubeEmbedUrl } from './youtube'

type SourceSection = TravelRuntimeSection
type SourceSectionMedia = NonNullable<SourceSection['mediaItems']>[number]

const SOURCE_SECTION_BOUNDARY_BODY = '__SECTION_BOUNDARY__'

type SourceSectionGroup = {
  anchor: string
  title: string
  intro?: SourceSection
  sections: SourceSection[]
}

type SourceSectionNode = {
  section: SourceSection
  children: SourceSection[]
}

export type TravelInteractionOptions = {
  comments: boolean
  thumbUp: boolean
  thumbDown: boolean
}

type RenderInteraction = (input: {
  associatedId: string
  className?: string
  enabledInteractions: TravelInteractionOptions
  label: string
  thread?: TravelInteractionThread
}) => ReactNode

export function TravelSourceSections({
  project,
  renderInteraction,
  threads = {},
}: {
  project: TravelRuntimeRecord
  renderInteraction?: RenderInteraction
  threads?: Record<string, TravelInteractionThread>
}) {
  const groups = groupSourceSections(project.sourceSections ?? [])

  if (!groups.length) {
    return null
  }

  return (
    <section className="grid w-full gap-8 pb-14 md:pb-20">
      <div className="grid gap-5">
        {groups.map((group) => (
          <SourceGroupCard
            group={group}
            key={group.anchor}
            projectSlug={project.slug}
            renderInteraction={renderInteraction}
            threads={threads}
          />
        ))}
      </div>
    </section>
  )
}

export function findDailySourceSections(
  sections: TravelRuntimeSection[],
  day: number,
): SourceSection[] {
  const groups = groupSourceSections(sections)
  const dailyGroup = groups.find(isDailyGroup)

  if (!dailyGroup) {
    return []
  }

  const dayPattern = new RegExp(`^\\s*(?:🚢|🌿)?\\s*Day\\s*${day}\\b`, 'i')
  const startIndex = dailyGroup.sections.findIndex((section) => dayPattern.test(section.title))

  if (startIndex < 0) {
    return []
  }

  const result: SourceSection[] = [dailyGroup.sections[startIndex]!]

  for (const section of dailyGroup.sections.slice(startIndex + 1)) {
    if (/^\s*(?:🚢|🌿)?\s*Day\s+\d+\b/i.test(section.title)) {
      break
    }

    result.push(section)
  }

  return result
}

export function SourceBody({
  body,
  layout = 'auto',
  tone = 'light',
}: {
  body: string
  layout?: 'auto' | 'single'
  tone?: 'light' | 'dark'
}) {
  const blocks = parseSourceBlocks(body)
  const mutedText = tone === 'dark' ? 'text-slate-300' : 'text-slate-600'
  const layoutBlocks = layout === 'auto'
    ? sourceBlockLayoutNodes(blocks)
    : blocks.map((block) => ({ block, forceWide: false }))
  const bodyGridClass = layout === 'auto' && layoutBlocks.some(({ forceWide }) => !forceWide) ? 'min-[560px]:grid-cols-2' : ''

  return (
    <div className={`mt-4 grid gap-4 text-sm leading-7 ${bodyGridClass} ${mutedText}`}>
      {layoutBlocks.map(({ block, forceWide }, index) => {
        const spanClass = layout === 'auto' ? sourceBlockSpanClass(block, forceWide) : ''

        if (block.type === 'table') {
          const [header, ...rows] = block.rows

          if (!header) {
            return null
          }

          return (
            <div
              className={
                tone === 'dark'
                  ? `overflow-x-auto rounded-2xl border border-cyan-100/15 bg-white/[0.06] shadow-sm shadow-slate-950/20 ${spanClass}`
                  : `overflow-x-auto rounded-2xl border border-cyan-100/70 bg-white/70 shadow-sm shadow-cyan-950/5 ${spanClass}`
              }
              key={`table-${index}`}
            >
              <table className={`${sourceTableWidthClass(header)} w-full table-fixed divide-y divide-cyan-100/70 text-left text-sm`}>
                <thead
                  className={
                    tone === 'dark'
                      ? 'bg-cyan-100/10 text-xs font-semibold uppercase tracking-wide text-cyan-50'
                      : 'bg-cyan-50/80 text-xs font-semibold uppercase tracking-wide text-cyan-900'
                  }
                >
                  <tr>
                    {header.map((cell, cellIndex) => (
                      <th
                        className={`${sourceTableColumnClass(cell, header)} whitespace-normal break-words px-4 py-3`}
                        key={`${cell}-${cellIndex}`}
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={tone === 'dark' ? 'divide-y divide-white/10' : 'divide-y divide-slate-100'}>
                  {rows.map((row, rowIndex) => (
                    <tr
                      className={tone === 'dark' ? 'transition hover:bg-white/[0.04]' : 'transition hover:bg-cyan-50/45'}
                      key={`row-${rowIndex}`}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          className={tone === 'dark' ? 'break-words px-4 py-3 align-top text-slate-300' : 'break-words px-4 py-3 align-top text-slate-600'}
                          key={`${rowIndex}-${cellIndex}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        if (block.type === 'heading') {
          return (
            <h5
              className={`${block.level === 1 ? 'text-xl' : 'text-lg'} font-semibold leading-tight tracking-normal ${tone === 'dark' ? 'text-white' : 'text-slate-950'} ${spanClass}`}
              data-planning-heading-level={block.level}
              key={`heading-${index}`}
            >
              {block.text}
            </h5>
          )
        }

        if (block.type === 'list') {
          return (
            <ul className={`grid gap-2 ${spanClass}`} key={`list-${index}`}>
              {block.items.map((item) => (
                <li className="flex gap-2" key={item}>
                  <span
                    className={tone === 'dark' ? 'mt-2 size-1.5 shrink-0 rounded-full bg-cyan-200' : 'mt-2 size-1.5 shrink-0 rounded-full bg-cyan-500'}
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              className={
                tone === 'dark'
                  ? `rounded-md border border-amber-100/20 bg-amber-100/10 px-4 py-3 text-amber-50 ${spanClass}`
                  : `rounded-md border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-amber-950 ${spanClass}`
              }
              key={`quote-${index}`}
            >
              {block.text}
            </blockquote>
          )
        }

        return (
          <p className={`whitespace-pre-wrap ${spanClass}`} key={`paragraph-${index}`}>
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

function SourceGroupCard({
  group,
  projectSlug,
  renderInteraction,
  threads,
}: {
  group: SourceSectionGroup
  projectSlug: string
  renderInteraction?: RenderInteraction
  threads: Record<string, TravelInteractionThread>
}) {
  const groupAssociatedId = sourceSectionKey(projectSlug, group.anchor)
  const sectionNodes = nestSourceSections(group.sections)
  const reminderGroup = isReminderGroup(group)
  const layoutNodes = sourceSectionLayoutNodes(sectionNodes, {
    orphanPlacement: reminderGroup ? 'first' : 'last',
  })

  if (reminderGroup) {
    return (
      <article
        className="border-y border-slate-800 bg-slate-950 px-5 py-12 text-white shadow-2xl shadow-slate-950/20 md:px-8 md:py-16"
        data-source-level="1"
        id={group.anchor}
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8">
          <header className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
              Reminders
            </p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-white md:text-5xl">
              {group.title}
            </h3>
          </header>
          <div className="grid gap-4">
            {group.intro && hasBody(group.intro) ? (
              <div className="max-w-5xl border-l border-cyan-100/20 pl-5">
                <SourceBody body={group.intro.body} layout="single" tone="dark" />
                <SourceSectionMediaRail section={group.intro} tone="dark" />
              </div>
            ) : null}
            <div className="grid gap-6 lg:grid-cols-2">
              {layoutNodes.map(({ forceWide, node }) => (
                <NestedSourceSection
                  key={node.section.id ?? node.section.anchor}
                  forceWide={forceWide}
                  node={node}
                  projectSlug={projectSlug}
                  renderInteraction={renderInteraction}
                  threads={threads}
                  tone="dark"
                />
              ))}
            </div>
          {renderInteraction && group.intro && hasBody(group.intro) && hasEnabledInteractions(interactionOptionsFor(group.intro))
            ? renderInteraction({
                className: 'border-white/15 bg-white/10 text-slate-300',
                associatedId: groupAssociatedId,
                enabledInteractions: interactionOptionsFor(group.intro),
                label: group.title,
                thread: threads[groupAssociatedId],
              })
              : null}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className="relative overflow-hidden border-y border-white/70 bg-gradient-to-br from-cyan-100/90 via-white/80 to-amber-100/80 px-5 py-10 shadow-sm shadow-cyan-950/5 backdrop-blur-xl md:py-14"
      data-source-level="1"
      id={group.anchor}
    >
      <div className="mx-auto w-full max-w-7xl">
        <header className="max-w-5xl">
          <h3 className="bg-gradient-to-r from-slate-950 via-cyan-700 to-amber-500 bg-clip-text text-3xl font-semibold leading-tight tracking-normal text-transparent md:text-5xl">
            {group.title}
          </h3>
          {group.intro && hasBody(group.intro) ? (
            <div className="mt-5 max-w-5xl border-l border-cyan-800/25 pl-5">
              <SourceBody body={group.intro.body} layout="single" />
              <SourceSectionMediaRail section={group.intro} />
            </div>
          ) : null}
          {renderInteraction && group.intro && hasBody(group.intro) && hasEnabledInteractions(interactionOptionsFor(group.intro))
            ? renderInteraction({
                className: 'max-w-3xl border-white/60 bg-white/35 px-4 pb-1',
                associatedId: groupAssociatedId,
                enabledInteractions: interactionOptionsFor(group.intro),
                label: group.title,
                thread: threads[groupAssociatedId],
              })
            : null}
        </header>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {layoutNodes.map(({ forceWide, node }) => (
            <NestedSourceSection
              key={node.section.id ?? node.section.anchor}
              forceWide={forceWide}
              node={node}
              projectSlug={projectSlug}
              renderInteraction={renderInteraction}
              threads={threads}
            />
          ))}
        </div>
        {group.intro ? <SourceLinks section={group.intro} /> : null}
      </div>
    </article>
  )
}

function NestedSourceSection({
  forceWide = false,
  node,
  projectSlug,
  renderInteraction,
  threads,
  tone = 'light',
}: {
  forceWide?: boolean
  node: SourceSectionNode
  projectSlug: string
  renderInteraction?: RenderInteraction
  threads: Record<string, TravelInteractionThread>
  tone?: 'light' | 'dark'
}) {
  const { section } = node
  const daily = isDailySection(section)
  const dark = tone === 'dark'
  const associatedId = sourceSectionKey(projectSlug, section.anchor)
  const spanClass = sourceSectionSpanClass(node, forceWide)
  const bodyLayout = spanClass ? 'auto' : 'single'
  const childLayoutNodes = node.children.length
    ? sourceSectionLayoutNodes(nodesForSections(node.children))
    : []

  return (
    <section
      className={`py-5 md:py-7 ${spanClass}`}
      data-source-level={section.level}
      id={section.anchor}
    >
      {daily ? (
        <DailySectionTitle section={section} tone={tone} />
      ) : (
        <h4
          className={dark ? 'text-[22px] font-semibold tracking-normal text-white' : 'text-[22px] font-semibold tracking-normal text-slate-950'}
          data-planning-heading-level="1"
        >
          {section.title}
        </h4>
      )}
      <SourceBody body={section.body} layout={bodyLayout} tone={tone} />
      <SourceLinks section={section} tone={tone} />
      <SourceSectionMediaRail section={section} tone={tone} />
      {node.children.length ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {childLayoutNodes.map(({ forceWide: forceWideChild, node: childNode }) => {
            const child = childNode.section
            const childSpanClass = sourceSectionSpanClass(childNode, forceWideChild)

            return (
              <section
                className={
                  dark
                    ? `rounded-2xl border border-white/10 bg-white/[0.06] p-4 ${childSpanClass}`
                    : `rounded-2xl border border-cyan-100/80 bg-cyan-50/55 p-4 ${childSpanClass}`
                }
                data-source-level={child.level}
                id={child.anchor}
                key={child.id ?? child.anchor}
              >
                <h5 className={dark ? 'text-[22px] font-semibold tracking-normal text-white' : 'text-[22px] font-semibold tracking-normal text-slate-950'}>
                  {child.title}
                </h5>
                <SourceBody body={child.body} layout={childSpanClass ? 'auto' : 'single'} tone={tone} />
                <SourceLinks section={child} tone={tone} />
                <SourceSectionMediaRail section={child} tone={tone} />
                {renderInteraction
                  && hasEnabledInteractions(interactionOptionsFor(child))
                  ? renderInteraction({
                      className: dark
                        ? 'rounded-2xl border-white/15 bg-white/10 px-4 pb-1 text-slate-300'
                        : 'rounded-2xl border-white/50 bg-white/35 px-4 pb-1',
                      associatedId: sourceSectionKey(projectSlug, child.anchor),
                      enabledInteractions: interactionOptionsFor(child),
                      label: child.title,
                      thread: threads[sourceSectionKey(projectSlug, child.anchor)],
                    })
                  : null}
              </section>
            )
          })}
        </div>
      ) : null}
      {renderInteraction
        && hasEnabledInteractions(interactionOptionsFor(section))
        ? renderInteraction({
            className: dark
              ? 'rounded-2xl border-white/15 bg-white/10 px-4 pb-1 text-slate-300'
              : 'rounded-2xl border-white/50 bg-white/35 px-4 pb-1',
            associatedId,
            enabledInteractions: interactionOptionsFor(section),
            label: section.title,
            thread: threads[associatedId],
          })
        : null}
    </section>
  )
}

function SourceSectionMediaRail({
  section,
  tone = 'light',
}: {
  section: SourceSection
  tone?: 'light' | 'dark'
}) {
  const items = mediaObjects(section.mediaItems)

  if (!items.length) {
    return null
  }

  const layoutClass =
    items.length === 1
      ? 'mx-auto mt-5 grid w-full max-w-4xl gap-3'
      : items.length <= 4
        ? 'mx-auto mt-5 grid w-full gap-3 sm:grid-cols-2'
        : 'mx-auto mt-5 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={layoutClass}>
      {items.map((item) => (
        <SectionMediaCard key={item.id} media={item} tone={tone} />
      ))}
    </div>
  )
}

function DailySectionTitle({ section, tone }: { section: SourceSection; tone: 'light' | 'dark' }) {
  const dark = tone === 'dark'
  const titleParts = dailyTitleParts(section)

  return (
    <div className="grid gap-1">
      <p
        className={dark ? 'text-lg font-semibold uppercase tracking-[0.18em] text-cyan-100/75 md:text-xl' : 'text-lg font-semibold uppercase tracking-[0.18em] text-[#65808b] md:text-xl'}
        data-daily-title-row="day"
      >
        {titleParts.day}
      </p>
      {titleParts.date ? (
        <p
          className={dark ? 'text-base font-medium text-slate-300 md:text-lg' : 'text-base font-medium text-slate-500 md:text-lg'}
          data-daily-title-row="date"
        >
          {titleParts.date}
        </p>
      ) : null}
      <h4
        className={dark ? 'text-2xl font-semibold leading-tight tracking-normal text-white md:text-4xl' : 'text-2xl font-semibold leading-tight tracking-normal text-slate-950 md:text-4xl'}
        data-daily-title-row="subtitle"
      >
        {titleParts.subtitle || section.title}
      </h4>
    </div>
  )
}

function dailyTitleParts(section: SourceSection): { day: string; date: string; subtitle: string } {
  const fallback = splitDailyTitle(section.title)

  return {
    day: displayText(section.displayDay, fallback.day),
    date: displayText(section.displayDate, fallback.date),
    subtitle: displayText(section.displaySubtitle, fallback.subtitle),
  }
}

function splitDailyTitle(title: string): { day: string; date: string; subtitle: string } {
  const match = title.match(/^\s*((?:🚢|🌿)?\s*Day\s+\d+)\s*[·.-]?\s*(.*)$/i)

  if (!match) {
    return {
      day: '每日節點',
      date: '',
      subtitle: title,
    }
  }

  const day = match[1]?.trim() ?? '每日節點'
  const rest = match[2]?.trim() ?? ''
  const [date = '', ...subtitleParts] = rest.split(/\s*[—–-]\s*/)

  return {
    day,
    date: date.trim(),
    subtitle: subtitleParts.join(' — ').trim(),
  }
}

function SectionMediaCard({ media, tone }: { media: Media; tone: 'light' | 'dark' }) {
  if (media.type === 'video') {
    const embedUrl = media.youtubeUrl ? toYouTubeEmbedUrl(media.youtubeUrl) : null

    if (!embedUrl) {
      return null
    }

    return (
      <Suspense fallback={<SectionVideoPlaceholder title={media.altText} tone={tone} />}>
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={tone === 'dark' ? 'aspect-video w-full rounded-lg border border-white/15 bg-white/10' : 'aspect-video w-full rounded-lg border border-cyan-100/80 bg-white/70'}
          src={embedUrl}
          title={media.altText}
        />
      </Suspense>
    )
  }

  return (
    <div className={tone === 'dark' ? 'rounded-lg border border-white/15 bg-white/10 p-2' : 'rounded-lg border border-white/70 bg-white/55 p-2'}>
      <PayloadImage
        className="rounded-md"
        fallbackLabel={media.altText}
        layout="intrinsic"
        media={media}
        preferOriginal
        sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
        tone="travel"
      />
      <p className={tone === 'dark' ? 'mt-2 flex items-center gap-1 text-xs font-medium text-slate-300' : 'mt-2 flex items-center gap-1 text-xs font-medium text-slate-500'}>
        <ImageIcon className="size-3.5" aria-hidden="true" />
        {media.altText}
      </p>
    </div>
  )
}

function SectionVideoPlaceholder({ title, tone }: { title: string; tone: 'light' | 'dark' }) {
  return (
    <div className={tone === 'dark' ? 'flex aspect-video items-center justify-center rounded-lg border border-white/15 bg-white/10 p-4 text-sm text-slate-300' : 'flex aspect-video items-center justify-center rounded-lg border border-cyan-100/80 bg-white/70 p-4 text-sm text-slate-600'}>
      <Video className="mr-2 size-4" aria-hidden="true" />
      {title}
    </div>
  )
}

export function sourceSectionKey(slug: string, anchor: string): string {
  return `travel:${slug}:source:${anchor}`
}

function SourceLinks({ section, tone = 'light' }: { section: SourceSection; tone?: 'light' | 'dark' }) {
  if (!section.links?.length) {
    return null
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/40 pt-4">
      {section.links.map((link) => (
        <a
          className={
            tone === 'dark'
              ? 'rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1 text-sm font-medium text-cyan-50 transition hover:bg-cyan-100/15'
              : 'rounded-full border border-cyan-200/70 bg-cyan-50/70 px-3 py-1 text-sm font-medium text-cyan-900 transition hover:bg-cyan-100'
          }
          href={link.url}
          key={link.id ?? link.url}
          rel="noreferrer"
          target="_blank"
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

function groupSourceSections(sections: SourceSection[]): SourceSectionGroup[] {
  const groups: SourceSectionGroup[] = []
  let current: SourceSectionGroup | undefined

  const ensureGroup = (title: string, anchor: string) => {
    current = groups.find((group) => group.anchor === anchor)

    if (!current) {
      current = {
        anchor,
        title,
        sections: [],
      }
      groups.push(current)
    }

    return current
  }

  for (const section of sections) {
    if (section.level === 1) {
      current = {
        anchor: section.anchor,
        title: section.title,
        intro: section,
        sections: [],
      }
      groups.push(current)
      continue
    }

    const virtualGroup = current ? null : virtualGroupFor(section)

    if (virtualGroup) {
      ensureGroup(virtualGroup.title, virtualGroup.anchor).sections.push(section)
      continue
    }

    if (!current) {
      current = {
        anchor: 'travel-planning-details',
        title: '旅行規劃細節',
        sections: [],
      }
      groups.push(current)
    }

    current.sections.push(section)
  }

  return groups
}

function nestSourceSections(sections: SourceSection[]): SourceSectionNode[] {
  const nodes: SourceSectionNode[] = []
  let current: SourceSectionNode | undefined

  for (const section of sections) {
    if (section.level >= 3 && current) {
      current.children.push(section)
      continue
    }

    current = {
      section,
      children: [],
    }
    nodes.push(current)
  }

  return nodes
}

function nodesForSections(sections: SourceSection[]): SourceSectionNode[] {
  return sections.map((section) => ({
    section,
    children: [],
  }))
}

function mediaObjects(items: SourceSectionMedia[] | null | undefined): Media[] {
  return (items ?? []).filter((item): item is Media => Boolean(item && typeof item === 'object'))
}

function displayText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value.trim() || fallback
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const localized = record['zh-TW'] ?? record.en ?? record.value

    if (typeof localized === 'string') {
      return localized.trim() || fallback
    }
  }

  return fallback
}

function interactionOptionsFor(section: SourceSection | undefined): TravelInteractionOptions {
  return {
    comments: section?.enableComments !== false,
    thumbUp: section?.enableThumbsUp !== false,
    thumbDown: section?.enableThumbsDown !== false,
  }
}

function hasEnabledInteractions(options: TravelInteractionOptions): boolean {
  return options.comments || options.thumbUp || options.thumbDown
}

function virtualGroupFor(section: SourceSection): Pick<SourceSectionGroup, 'anchor' | 'title'> | null {
  if (/^\s*(?:🚢|🌿)?\s*Day\s+\d+\b/i.test(section.title)) {
    return {
      anchor: 'daily-itinerary-details',
      title: '🗓️ 每日行程詳解',
    }
  }

  if (/航班|高鐵|住宿|艙房|交通/.test(section.title)) {
    return {
      anchor: 'transport-and-lodging-details',
      title: '✈️ 航班、高鐵與住宿安排',
    }
  }

  if (/重慶段|游輪段|宜昌段|不辣|親子|美食|餐/.test(section.title)) {
    return {
      anchor: 'food-recommendations-details',
      title: '🍜 美食推薦匯總',
    }
  }

  if (/費用|自費|門票|價格/.test(section.title)) {
    return {
      anchor: 'cost-summary-details',
      title: '💰 費用匯總',
    }
  }

  if (/防暑|帶娃|預約|登船|注意|提醒/.test(section.title)) {
    return {
      anchor: 'important-reminders-details',
      title: '⚠️ 重要提醒',
    }
  }

  return null
}

function isDailyGroup(group: SourceSectionGroup) {
  return group.anchor === 'daily-itinerary-details' || /每日行程/.test(group.title)
}

function isReminderGroup(group: SourceSectionGroup) {
  return /注意事項|提醒|安全/.test(group.title)
}

function isDailySection(section: SourceSection) {
  return /^\s*(?:🚢|🌿)?\s*Day\s+\d+\b/i.test(section.title)
}

function hasBody(section: SourceSection) {
  return Boolean(section.body.trim()) && section.body.trim() !== SOURCE_SECTION_BOUNDARY_BODY
}

type SourceBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; rows: string[][] }

function sourceBlockSpanClass(block: SourceBlock, forceWide = false): string {
  if (forceWide) {
    return 'min-[560px]:col-span-2'
  }

  if (block.type === 'table') {
    return 'min-[560px]:col-span-2'
  }

  if (block.type === 'heading') {
    return 'min-[560px]:col-span-2'
  }

  if (block.type === 'list') {
    return block.items.some(isWideSourceListItem) ? 'min-[560px]:col-span-2' : ''
  }

  return isWideSourceText(block.text) ? 'min-[560px]:col-span-2' : ''
}

function sourceBlockLayoutNodes(blocks: SourceBlock[]): Array<{
  block: SourceBlock
  forceWide: boolean
}> {
  const layout = blocks.map((block) => ({
    block,
    forceWide: false,
  }))
  let compactRun: number[] = []

  const flushCompactRun = () => {
    if (compactRun.length % 2 === 1) {
      const orphanIndex = compactRun[compactRun.length - 1]

      if (orphanIndex !== undefined) {
        layout[orphanIndex]!.forceWide = true
      }
    }

    compactRun = []
  }

  blocks.forEach((block, index) => {
    if (sourceBlockSpanClass(block)) {
      flushCompactRun()
      return
    }

    compactRun.push(index)
  })
  flushCompactRun()

  return layout
}

type CompactOrphanPlacement = 'first' | 'last'

function sourceSectionLayoutNodes(
  nodes: SourceSectionNode[],
  {
    orphanPlacement = 'last',
  }: {
    orphanPlacement?: CompactOrphanPlacement
  } = {},
): Array<{
  forceWide: boolean
  node: SourceSectionNode
}> {
  const layout = nodes.map((node) => ({
    node,
    forceWide: false,
  }))
  let compactRun: number[] = []

  const flushCompactRun = () => {
    if (compactRun.length % 2 === 1) {
      const orphanIndex =
        orphanPlacement === 'first'
          ? compactRun[0]
          : compactRun[compactRun.length - 1]

      if (orphanIndex !== undefined) {
        layout[orphanIndex]!.forceWide = true
      }
    }

    compactRun = []
  }

  nodes.forEach((node, index) => {
    if (isWideSourceSectionNode(node)) {
      flushCompactRun()
      return
    }

    compactRun.push(index)
  })
  flushCompactRun()

  return layout
}

function sourceSectionSpanClass(node: SourceSectionNode, forceWide = false): string {
  return forceWide || isWideSourceSectionNode(node) ? 'lg:col-span-2' : ''
}

function isWideSourceSectionNode(node: SourceSectionNode): boolean {
  const { section } = node

  if (isDailySection(section) || node.children.length || mediaObjects(section.mediaItems).length) {
    return true
  }

  return parseSourceBlocks(section.body).some(isWideSourceBlock)
}

function isWideSourceBlock(block: SourceBlock): boolean {
  if (block.type === 'table') {
    return !isCompactTable(block.rows)
  }

  if (block.type === 'heading') {
    return true
  }

  if (block.type === 'list') {
    return block.items.some(isWideSourceListItem)
  }

  return isWideSourceText(block.text)
}

function isCompactTable(rows: string[][]): boolean {
  if (!rows.length || rows.length > 6) {
    return false
  }

  const columnCount = Math.max(...rows.map((row) => row.length))

  if (columnCount > 2) {
    return false
  }

  return rows.every((row) => row.every((cell) => isCompactTableCell(cell)))
}

function isCompactTableCell(cell: string): boolean {
  const normalized = cell.replace(/\s+/g, ' ').trim()

  return normalized.length <= 28 && !/https?:\/\/|；|;/.test(normalized)
}

function isWideSourceText(text: string): boolean {
  const normalized = normalizeSourceText(text)

  return normalized.length > 88 || /https?:\/\/| vs | vs\.|；|;/.test(normalized)
}

function isWideSourceListItem(text: string): boolean {
  const normalized = normalizeSourceText(text)

  return normalized.length > 72 || /https?:\/\/| vs | vs\./.test(normalized) || (normalized.length > 48 && /；|;/.test(normalized))
}

function normalizeSourceText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function parseSourceBlocks(body: string): SourceBlock[] {
  const blocks: SourceBlock[] = []
  const lines = body.split('\n')
  let index = 0

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? ''

    if (!line) {
      index += 1
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)

    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1]?.length ?? 1,
        text: cleanInline(heading[2] ?? ''),
      })
      index += 1
      continue
    }

    if (isTableLine(line)) {
      const tableLines: string[] = []

      while (index < lines.length && isTableLine(lines[index]?.trim() ?? '')) {
        const tableLine = lines[index]?.trim() ?? ''

        if (!/^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(tableLine)) {
          tableLines.push(tableLine)
        }

        index += 1
      }

      blocks.push({
        type: 'table',
        rows: tableLines.map(parseTableRow),
      })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []

      while (index < lines.length && /^[-*]\s+/.test(lines[index]?.trim() ?? '')) {
        items.push(cleanInline((lines[index]?.trim() ?? '').replace(/^[-*]\s+/, '')))
        index += 1
      }

      blocks.push({ type: 'list', items })
      continue
    }

    if (line.startsWith('>')) {
      blocks.push({
        type: 'quote',
        text: cleanInline(line.replace(/^>\s?/, '')),
      })
      index += 1
      continue
    }

    const paragraphs: string[] = []

    while (
      index < lines.length &&
      lines[index]?.trim() &&
      !/^(#{1,6})\s+/.test(lines[index]?.trim() ?? '') &&
      !isTableLine(lines[index]?.trim() ?? '') &&
      !/^[-*]\s+/.test(lines[index]?.trim() ?? '') &&
      !(lines[index]?.trim() ?? '').startsWith('>')
    ) {
      paragraphs.push(cleanInline(lines[index]?.trim() ?? ''))
      index += 1
    }

    blocks.push({
      type: 'paragraph',
      text: paragraphs.join('\n'),
    })
  }

  return blocks
}

function isTableLine(line: string) {
  return line.startsWith('|') && line.includes('|')
}

function parseTableRow(line: string) {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cleanInline(cell.trim()))
}

function isEightColumnAirlineFlightTable(headers: string[]): boolean {
  return headers.length === 8 && headers.some((cell) => /航空公司|Airline/i.test(cell))
}

function sourceTableWidthClass(headers: string[]): string {
  const columnCount = headers.length

  if (isEightColumnAirlineFlightTable(headers)) {
    return 'min-w-[64rem]'
  }

  if (columnCount >= 5) {
    return 'min-w-[56rem]'
  }

  if (columnCount >= 4) {
    return 'min-w-[44rem]'
  }

  return 'min-w-full'
}

function sourceTableColumnClass(header: string, headers: string[]): string {
  const normalized = header.replace(/\s+/g, '')
  const columnCount = headers.length

  if (isEightColumnAirlineFlightTable(headers)) {
    if (/日期|Date/i.test(normalized)) return 'w-[10%]'
    if (/航空公司|Airline/i.test(normalized)) return 'w-[14%]'
    if (/航班號|Flight/i.test(normalized)) return 'w-[9%]'
    if (/航線|Route/i.test(normalized)) return 'w-[22%]'
    if (/旅客|Passenger/i.test(normalized)) return 'w-[10%]'
    if (/起飛|Departure/i.test(normalized)) return 'w-[9%]'
    if (/抵達|Arrival/i.test(normalized)) return 'w-[9%]'
    if (/備注|備註|Notes?/i.test(normalized)) return 'w-[17%]'
  }

  if (/日期|Date/i.test(normalized)) return 'w-[12%]'
  if (/航班號|Flight/i.test(normalized)) return 'w-[17%]'
  if (/航線|Route/i.test(normalized)) return 'w-[27%]'
  if (/起飛|Departure/i.test(normalized)) return 'w-[10%]'
  if (/抵達|Arrival/i.test(normalized)) return 'w-[10%]'
  if (/旅客|Passenger/i.test(normalized)) return 'w-[24%]'
  if (/城市|City/i.test(normalized)) return 'w-[9%]'
  if (/酒店|飯店|Hotel/i.test(normalized)) return 'w-[24%]'
  if (/房型|Room/i.test(normalized)) return 'w-[15%]'
  if (/地址|Address/i.test(normalized)) return 'w-[28%]'
  if (/確認號|Confirmation/i.test(normalized)) return 'w-[12%]'
  if (/時間|時段|Time/i.test(normalized)) return 'w-[13%]'
  if (/安排|行程|Schedule/i.test(normalized)) return 'w-[42%]'
  if (/交通|Transport/i.test(normalized)) return 'w-[18%]'
  if (/備注|備註|Notes?/i.test(normalized)) return columnCount === 6 ? 'w-[24%]' : 'w-[27%]'

  if (columnCount === 2) return 'w-1/2'
  if (columnCount === 3) return 'w-1/3'
  if (columnCount === 4) return 'w-1/4'
  if (columnCount === 5) return 'w-1/5'
  if (columnCount === 6) return 'w-1/6'

  return ''
}

function cleanInline(value: string) {
  return value
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\\\|/g, '|')
    .trim()
}
