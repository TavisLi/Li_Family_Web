import { readFile } from 'node:fs/promises'
import { parseTravelMarkdown, type MediaSeed } from './seed-content'
import { buildTravelMemoryProjection } from './travel-seed-projections'
import { buildTravelMemoryDayProjections } from './travel-memory-day-projections'
import { parseMemorySourceV2 } from './travel-memory-source-v2'

// Mechanical fixture conversion, not a migration or an importer. The original
// file and manifest stay untouched; missing alt text is not invented.
export async function australiaV2Fixture(): Promise<string> {
  const source = await parseTravelMarkdown('content-source/travels/202308東澳全覽9日.md')
  const assets = JSON.parse(await readFile('content-source/assets/travels/202308-east-australia/manifest.json', 'utf8')) as MediaSeed[]
  const parent = buildTravelMemoryProjection(source)
  const { days } = buildTravelMemoryDayProjections(source, assets)
  const header = {
    sourceVersion: 2, locale: 'zh-TW', title: source.title, slug: source.slug,
    startDate: source.startDate.slice(0, 10), endDate: source.endDate.slice(0, 10), isPrivate: source.isPrivate,
    ...(source.summary ? { summary: source.summary } : {}),
    coverImage: assets.find(item => item.usage === 'cover')?.sourcePath,
    galleryImages: assets.filter(item => item.usage === 'gallery').map(item => item.sourcePath),
  }
  const block = (kind: string, data: unknown) => `\n\`\`\`${kind}\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`
  const table = (heading: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) return ''
    const columns = [...new Set(rows.flatMap(row => Object.keys(row).filter(key => row[key] !== undefined)))]
    const line = (cells: string[]) => `| ${cells.join(' | ')} |\n`
    return `\n# ${heading}\n` + line(columns) + line(columns.map(() => '---')) + rows.map(row => line(columns.map(key => String(row[key] ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')))).join('')
  }
  let markdown = `---\n${JSON.stringify(header, null, 2)}\n---\n\n<!-- Generated test fixture from tracked Australia source and manifest. Not approved for live import. -->\n`
  markdown += table('航班', parent.travelLedger?.flights ?? [])
  markdown += table('住宿', parent.travelLedger?.lodgings ?? [])
  markdown += table('同行者', (source.party ?? []).map(item => ({ name: item.name, ...(item.note ? { note: item.note } : {}) })))
  markdown += table('影片', (source.externalVideos ?? []).map(item => ({ title: item.title, url: item.youtubeUrl })))
  for (const item of parent.storySections ?? []) markdown += block('memory-story', item)
  for (const { dayKey: _key, moments, ...day } of days) markdown += block('memory-day', {
    ...day, date: day.date.slice(0, 10), moments: moments.map(({ momentKey: _identity, placements, ...moment }, index) => ({
      ...moment, scene: `${index + 1} ${moment.title}`,
      placements: placements.map(({ placementKey: _placement, mediaSourcePath, ...placement }) => ({
        ...placement, ...(mediaSourcePath ? { media: mediaSourcePath } : {}),
      })),
    })),
  })
  for (const group of source.reminders ?? []) markdown += block('memory-reminder', {
    category: group.category, items: (group.items ?? []).map((item, index) => ({ entry: `${index + 1}`, text: item.text })),
  })
  parseMemorySourceV2(markdown)
  return markdown
}

if (process.argv.includes('--print-fixture')) process.stdout.write(await australiaV2Fixture())
