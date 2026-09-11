// Validate before environment/config initialization: a misspelled v2 command
// must never fall through to the legacy all-collection seed writer.
export function memoryV2Args(args: string[]) {
  const index = args.indexOf('--memory-v2')
  if (index < 0) {
    if (args.includes('--apply-v2')) throw new Error('--apply-v2 requires --memory-v2 <file>')
    return undefined
  }
  const file = args[index + 1]
  if (!file || file.startsWith('--')) throw new Error('--memory-v2 requires a Markdown filename')
  const remaining = args.filter((_, position) => position !== index && position !== index + 1)
  const allowed = new Set(['--travel-only', '--dry-run', '--apply-v2'])
  if (remaining.some(arg => !allowed.has(arg)) || new Set(remaining).size !== remaining.length) {
    throw new Error('Source v2 accepts only --travel-only, --dry-run or --apply-v2; safe reconciliation is mandatory')
  }
  if (remaining.includes('--dry-run') && remaining.includes('--apply-v2')) throw new Error('Choose --dry-run or --apply-v2, not both')
  return { file, apply: remaining.includes('--apply-v2') }
}
