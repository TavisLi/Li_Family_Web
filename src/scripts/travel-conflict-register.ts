import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { DryRunAction } from './seed-dry-run'

export type TravelConflictDecision =
  | 'manual-merge'
  | 'parser-noise'
  | 'payload-wins'
  | 'schema-cleanup-candidate'
  | 'source-wins'

export type TravelConflictRegisterEntry = {
  slug: string
  field: string
  category: string
  sourceSummary: string
  currentSummary: string
  decision: TravelConflictDecision
  risk: string
}

export function buildTravelConflictRegister(
  actions: DryRunAction[],
  decisionOverrides: Record<string, TravelConflictDecision> = {},
): TravelConflictRegisterEntry[] {
  return actions.flatMap((action) => {
    if (
      !['travel-memories', 'travel-plans'].includes(action.collection) ||
      action.action !== 'conflict'
    ) {
      return []
    }

    return (action.conflicts ?? []).map((conflict) => {
      const key = `${action.key}:${conflict.field}`
      const decision = decisionOverrides[key] ?? inferDecision(conflict)

      return {
        slug: action.key,
        field: conflict.field,
        category: conflict.category,
        sourceSummary: summarize(conflict.source),
        currentSummary: summarize(conflict.current),
        decision,
        risk: riskFor(decision),
      }
    })
  })
}

export async function writeTravelConflictRegister(input: {
  artifactRoot: string
  entries: TravelConflictRegisterEntry[]
}): Promise<string> {
  const destination = path.join(input.artifactRoot, 'travel-conflict-register.generated.md')
  await mkdir(input.artifactRoot, { recursive: true })
  const rows = input.entries.map((entry) =>
    [
      entry.slug,
      entry.field,
      entry.category,
      entry.sourceSummary,
      entry.currentSummary,
      entry.decision,
      entry.risk,
    ].map(markdownCell).join(' | '),
  )
  const content = [
    '# Generated Travel Conflict Register',
    '',
    '> Read-only Base / Source / Current evidence. This file does not authorize a write.',
    '',
    '| Slug | Field | Category | Source | Current | Decision | Risk |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row} |`),
    '',
  ].join('\n')

  await writeFile(destination, content, 'utf8')
  return destination
}

function inferDecision(conflict: NonNullable<DryRunAction['conflicts']>[number]): TravelConflictDecision {
  return sameValue(conflict.base, conflict.source) && !sameValue(conflict.base, conflict.current)
    ? 'payload-wins'
    : 'manual-merge'
}

function riskFor(decision: TravelConflictDecision): string {
  if (decision === 'payload-wins') return 'Replacing Current would lose an Admin edit.'
  if (decision === 'source-wins') return 'Source write requires explicit owner approval.'
  if (decision === 'parser-noise') return 'Fix normalization before changing published content.'
  if (decision === 'schema-cleanup-candidate') return 'Collect usage and non-null evidence before migration.'
  return 'Source and Current need owner review before mutation.'
}

function summarize(value: unknown): string {
  const serialized = JSON.stringify(value)
  if (serialized === undefined) return '(omitted)'
  return serialized.length > 180 ? `${serialized.slice(0, 177)}...` : serialized
}

function markdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
