import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

// Explicit, sequential allowlist. PostgreSQL tests run in the disposable job.
// Frozen #101 package verification requires its historical Node 20 and commit;
// agent-governance.test.ts writes preserved #113 evidence. Neither is current CI.
// #105 recorded examples bind manifests to historical artifact bytes. Run the
// other contract cases here; replay those examples only at their frozen baseline.
const historicalCases = new Map([
  ['src/scripts/run-agent-summary.test.mjs', '^verified summary is compact, delta aware, and does not invent approval$'],
  ['src/scripts/run-contract.test.mjs', '^checked-in Slice 1 example replays from the current artifact bytes$'],
  ['src/scripts/run-local-closeout-evidence.test.mjs', '^recorded local matrix is bound to current bytes and has a terminal receipt for every fault$'],
])
const files = [
  'src/features/home/member-portal-link.test.ts',
  'src/features/member/member-profile-page.test.tsx',
  'src/features/member/typewriter.test.ts',
  'src/features/travel/travel-detail-page.test.tsx',
  'src/features/travel/travel-index-page.test.tsx',
  'src/features/travel/travel-memory-pages.test.tsx',
  'src/features/travel/youtube.test.ts',
  'src/lib/data/auth-session.test.ts',
  'src/lib/data/phase-7-domain.test.ts',
  'src/lib/data/travel-memory-child-access.test.ts',
  'src/lib/site-metadata.test.ts',
  'src/lib/travel-domain.test.ts',
  'src/lib/travel-interactions.test.ts',
  'src/lib/travel-memory-rollout.test.ts',
  'src/lib/travel-memory.test.ts',
  'src/lib/travel-runtime.test.ts',
  'src/payload/access/is-admin.test.ts',
  'src/payload/collections/travel-collections.test.ts',
  'src/payload/collections/travel-memory-keys.test.ts',
  'src/payload/collections/users.test.ts',
  'src/payload/r2-preview.test.ts',
  'src/payload/r2.test.ts',
  'src/scripts/account-provisioning.test.ts',
  'src/scripts/daily-hero-image-migration.test.ts',
  'src/scripts/payload-local-api-lifecycle-package.test.ts',
  'src/scripts/phase19-travel-memory-backfill.test.ts',
  'src/scripts/phase21-c0-connection.test.mjs',
  'src/scripts/phase21-c0-evidence.test.mjs',
  'src/scripts/phase21-c0-execute.test.mjs',
  'src/scripts/phase21-c0-inventory.test.mjs',
  'src/scripts/phase21-c0-pages.test.mjs',
  'src/scripts/phase21-c0-parents.test.mjs',
  'src/scripts/phase21-c0-response.test.mjs',
  'src/scripts/phase21-c0-security.test.mjs',
  'src/scripts/phase21-c0-session.test.mjs',
  'src/scripts/phase21-c0-worker-process.test.mjs',
  'src/scripts/phase21-retirement-cleanup-plan.test.mjs',
  'src/scripts/phase21-retirement-scope.test.mjs',
  'src/scripts/phase21-travel-memory-inventory.test.ts',
  'src/scripts/phase21-travel-memory-migration-package.test.ts',
  'src/scripts/phase21-travel-memory-seed-safety.test.ts',
  'src/scripts/run-agent-summary.test.mjs',
  'src/scripts/run-contract.test.mjs',
  'src/scripts/run-efficiency-replay.test.mjs',
  'src/scripts/run-executor-terminal.test.mjs',
  'src/scripts/run-executor.test.mjs',
  'src/scripts/run-local-approval.test.mjs',
  'src/scripts/run-local-closeout-evidence.test.mjs',
  'src/scripts/run-local-session.test.mjs',
  'src/scripts/run-preview-qa.test.mjs',
  'src/scripts/seed-audit.test.ts',
  'src/scripts/seed-content.test.ts',
  'src/scripts/seed-dry-run.test.ts',
  'src/scripts/seed-media-context.test.ts',
  'src/scripts/seed-media-repair.test.ts',
  'src/scripts/seed-member-locale.test.ts',
  'src/scripts/seed-scope.test.ts',
  'src/scripts/seed-upload-name.test.ts',
  'src/scripts/travel-conflict-register.test.ts',
  'src/scripts/travel-daily-table-boundaries.test.ts',
  'src/scripts/travel-data-api-security-package.test.ts',
  'src/scripts/travel-legacy-cleanup-package.test.ts',
  'src/scripts/travel-memory-day-projections.test.ts',
  'src/scripts/travel-memory-source-contract.test.ts',
  'src/scripts/travel-memory-source-v2.test.ts',
  'src/scripts/travel-section-media.test.ts',
  'src/scripts/travel-seed-reconciliation.test.ts',
  'src/scripts/travel-seed-target.test.ts',
]

for (const file of files) {
  if (!existsSync(file)) throw new Error(`Missing allowed test: ${file}`)
}
const group = process.argv.slice(2).find(arg => arg !== '--list') ?? 'all'
if (!['all', 'frontend', 'travel'].includes(group)) throw new Error(`Unknown test group: ${group}`)
const selected = files.filter(file => {
  if (group === 'all') return true
  if (group === 'frontend') return file.startsWith('src/features/home/') ||
    file.startsWith('src/features/member/') || file === 'src/lib/site-metadata.test.ts' ||
    file === 'src/lib/data/auth-session.test.ts' || file === 'src/payload/access/is-admin.test.ts' ||
    file === 'src/payload/collections/users.test.ts'
  return file.includes('travel') || file.includes('seed-') || file.includes('daily-hero') ||
    file === 'src/payload/r2.test.ts' || file === 'src/payload/r2-preview.test.ts'
})
if (!selected.length) throw new Error(`No tests selected for ${group}`)
if (process.argv.includes('--list')) {
  console.log(selected.join('\n'))
} else {
  for (const file of selected) {
    const historicalCase = historicalCases.get(file)
    const result = spawnSync(process.execPath, [...(historicalCase ? ['--test', `--test-skip-pattern=${historicalCase}`] : []),
      ...(file.endsWith('.mjs') ? [] : ['--import', 'tsx']), file],
      { encoding: 'utf8', env: process.env, maxBuffer: 8 * 1024 * 1024 })
    if (result.status !== 0) {
      console.error(`FAIL ${file}\n${(result.stderr + result.stdout).slice(-8192)}`)
      process.exit(1)
    }
    console.log(`PASS ${file}${historicalCase ? ' (frozen evidence replay N/A)' : ''}`)
  }
  console.log(`Offline allowlist: ${selected.length} passed`)
}
