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
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/65 bg-white/50 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
        <div className="grid gap-6 bg-[radial-gradient(circle_at_15%_0%,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(251,146,60,0.12),transparent_28%)] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-800">
              Family travel atlas
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-slate-950 md:text-5xl">
              來源章節已整理成正式行程地圖
            </h2>
          </div>
          <div className="self-end">
            <p className="text-sm leading-7 text-slate-600">
              依 Markdown H1 的邏輯重排航班、住宿、網站、費用、美食、交通、提醒與其他規劃內容；來源細節直接進入正式頁面，每個章節都保留家人討論、thumb-up 與 thumb-down。
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full border border-white/70 bg-white/60 px-3 py-1">
                {groups.length} 個正式模組
              </span>
              <span className="rounded-full border border-white/70 bg-white/60 px-3 py-1">
                來源表格已產品化
              </span>
              <span className="rounded-full border border-white/70 bg-white/60 px-3 py-1">
                每段內容可討論
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        {groups.map((group, index) => (
          <SourceGroupCard
            group={group}
            key={group.anchor}
            moduleIndex={index + 1}
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
            <div
              className="overflow-x-auto rounded-2xl border border-cyan-100/70 bg-white/70 shadow-sm shadow-cyan-950/5"
              key={`table-${index}`}
            >
              <table className="min-w-full divide-y divide-cyan-100/70 text-left text-sm">
                <thead className="bg-cyan-50/80 text-xs font-semibold uppercase tracking-wide text-cyan-900">
                  <tr>
                    {header.map((cell) => (
                      <th className="px-4 py-3" key={cell}>
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, rowIndex) => (
                    <tr className="transition hover:bg-cyan-50/45" key={`row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td className="px-4 py-3 align-top text-slate-600" key={`${rowIndex}-${cellIndex}`}>
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
  moduleIndex,
  projectSlug,
  renderInteraction,
  threads,
}: {
  group: SourceSectionGroup
  moduleIndex: number
  projectSlug: string
  renderInteraction?: RenderInteraction
  threads: Record<string, TravelInteractionThread>
}) {
  const groupAssociatedId = sourceSectionKey(projectSlug, group.anchor)

  return (
    <article
      className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-sm shadow-slate-900/5 backdrop-blur-xl md:p-7"
      id={group.anchor}
    >
      <div className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 via-teal-300 to-amber-300" />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800">
            行程章節 · {String(moduleIndex).padStart(2, '0')}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
            {group.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-full border border-white/70 bg-white/65 px-3 py-1">
            Markdown H1
          </span>
          <span className="rounded-full border border-white/70 bg-white/65 px-3 py-1">
            {group.sections.length + (group.intro ? 1 : 0)} 段內容
          </span>
        </div>
      </div>
      {group.intro ? (
        <div className="mt-5 rounded-[1.5rem] border border-white/60 bg-white/50 p-4">
          <SourceBody body={group.intro.body} />
        </div>
      ) : null}
      {renderInteraction
        ? renderInteraction({
            className: 'rounded-2xl border-white/50 bg-white/35 px-4 pb-1',
            associatedId: groupAssociatedId,
            label: group.title,
            thread: threads[groupAssociatedId],
          })
        : null}
      <div className="mt-5 grid gap-4">
        {group.sections.map((section) => (
          <section
            className="rounded-[1.5rem] border border-white/60 bg-white/55 p-4 shadow-sm shadow-slate-900/5 md:p-5"
            key={section.id ?? section.anchor}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              子章節 · H{section.level}
            </p>
            <h4 className="mt-2 text-lg font-semibold tracking-normal text-slate-950">{section.title}</h4>
            <SourceBody body={section.body} />
            <SourceLinks section={section} />
            {renderInteraction
              ? renderInteraction({
                  className: 'rounded-2xl border-white/50 bg-white/35 px-4 pb-1',
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
