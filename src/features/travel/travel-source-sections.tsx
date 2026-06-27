import React from 'react'
import type { ReactNode } from 'react'

import type { TravelInteractionThread } from '@/lib/data/travel'
import type { TravelProject } from '@/payload/payload-types'

type SourceSection = NonNullable<TravelProject['sourceSections']>[number]

type SourceSectionGroup = {
  anchor: string
  title: string
  intro?: SourceSection
  sections: SourceSection[]
}

type RenderInteraction = (input: {
  associatedId: string
  className?: string
  label: string
  thread?: TravelInteractionThread
}) => ReactNode

export function TravelSourceSections({
  project,
  renderInteraction,
  threads = {},
}: {
  project: TravelProject
  renderInteraction?: RenderInteraction
  threads?: Record<string, TravelInteractionThread>
}) {
  const groups = groupSourceSections(project.sourceSections ?? []).filter(
    (group) => !isDailyGroup(group),
  )

  if (!groups.length) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-14 md:pb-20">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase text-slate-500">Itinerary Modules</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
          按來源章節重組的正式行程模組
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          依 Markdown H1 的邏輯重排航班、住宿、網站、費用、美食、交通、提醒與其他規劃內容；來源細節直接進入正式頁面，不再另放附錄。
        </p>
      </div>

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
  sections: NonNullable<TravelProject['sourceSections']>,
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

export function SourceBody({ body }: { body: string }) {
  const blocks = parseSourceBlocks(body)

  return (
    <div className="mt-4 grid gap-4 text-sm leading-7 text-slate-600">
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          const [header, ...rows] = block.rows

          if (!header) {
            return null
          }

          return (
            <div className="overflow-x-auto rounded-md border border-white/50 bg-white/45" key={`table-${index}`}>
              <table className="min-w-full divide-y divide-white/60 text-left text-sm">
                <thead className="bg-white/55 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    {header.map((cell) => (
                      <th className="px-3 py-2" key={cell}>
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td className="px-3 py-2 align-top" key={`${rowIndex}-${cellIndex}`}>
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

        if (block.type === 'list') {
          return (
            <ul className="grid gap-2" key={`list-${index}`}>
              {block.items.map((item) => (
                <li className="flex gap-2" key={item}>
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              className="rounded-md border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-amber-950"
              key={`quote-${index}`}
            >
              {block.text}
            </blockquote>
          )
        }

        return (
          <p className="whitespace-pre-wrap" key={`paragraph-${index}`}>
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

  return (
    <article
      className="rounded-lg border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur-xl md:p-6"
      id={group.anchor}
    >
      <p className="text-xs font-semibold uppercase text-cyan-800">Markdown H1 Module</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
        {group.title}
      </h3>
      {group.intro ? <SourceBody body={group.intro.body} /> : null}
      {renderInteraction
        ? renderInteraction({
            associatedId: groupAssociatedId,
            label: group.title,
            thread: threads[groupAssociatedId],
          })
        : null}
      <div className="mt-5 grid gap-4">
        {group.sections.map((section) => (
          <section className="rounded-md border border-white/50 bg-white/40 p-4" key={section.id ?? section.anchor}>
            <p className="text-xs font-semibold uppercase text-slate-500">H{section.level}</p>
            <h4 className="mt-1 text-lg font-semibold tracking-normal text-slate-950">{section.title}</h4>
            <SourceBody body={section.body} />
            <SourceLinks section={section} />
            {renderInteraction
              ? renderInteraction({
                  associatedId: sourceSectionKey(projectSlug, section.anchor),
                  label: section.title,
                  thread: threads[sourceSectionKey(projectSlug, section.anchor)],
                })
              : null}
          </section>
        ))}
      </div>
      {group.intro ? <SourceLinks section={group.intro} /> : null}
    </article>
  )
}

export function sourceSectionKey(slug: string, anchor: string): string {
  return `travel:${slug}:source:${anchor}`
}

function SourceLinks({ section }: { section: SourceSection }) {
  if (!section.links?.length) {
    return null
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/40 pt-4">
      {section.links.map((link) => (
        <a
          className="rounded-full border border-cyan-200/70 bg-cyan-50/70 px-3 py-1 text-sm font-medium text-cyan-900 transition hover:bg-cyan-100"
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

    const virtualGroup = virtualGroupFor(section)

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

type SourceBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; rows: string[][] }

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

function cleanInline(value: string) {
  return value
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\\\|/g, '|')
    .trim()
}
