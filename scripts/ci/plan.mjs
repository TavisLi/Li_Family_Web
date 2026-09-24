import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { validateChangedDocs } from './validate.mjs'

const documentation = (path) => (path.endsWith('.md') &&
  (path.startsWith('docs/') || !path.includes('/')) &&
  !['docs/travel-projects.md', 'docs/family-members.md'].includes(path)) ||
  path.startsWith('.github/ISSUE_TEMPLATE/') || path === '.github/pull_request_template.md'
const governance = (path) => path.startsWith('.github/ISSUE_TEMPLATE/') ||
  ['.github/pull_request_template.md', '.github/dependabot.yml',
    '.github/workflows/ci.yml', '.github/workflows/codeql.yml'].includes(path) ||
  path.startsWith('scripts/ci/') || path === 'vercel.json'
const dependencies = (path) => path === 'package.json' || path === 'pnpm-lock.yaml' ||
  path.startsWith('patches/') || path === '.npmrc' || path === '.nvmrc'
const schema = (path) => path.startsWith('src/migrations/') ||
  path.startsWith('src/payload/collections/') || path.startsWith('src/scripts/phase21-') ||
  path.startsWith('src/scripts/run-executor') || path.startsWith('src/scripts/run-local-')
const disposable = (path) => path.startsWith('src/scripts/run-executor') ||
  path.startsWith('src/scripts/run-local-') || path === 'src/scripts/run-contract.mjs'

export function changedPaths(diff) {
  const fields = diff.toString('utf8').split('\0')
  if (fields.at(-1) === '') fields.pop()
  const paths = []
  for (let i = 0; i < fields.length;) {
    const status = fields[i++]
    if (!/^(?:[ACDM]|R\d{1,3}|C\d{1,3}|T)$/.test(status)) throw new Error(`Unknown diff status: ${status}`)
    const count = /^[RC]/.test(status) ? 2 : 1
    for (let j = 0; j < count; j++) {
      const path = fields[i++]
      if (!path || path.startsWith('/') || path.includes('..')) throw new Error('Invalid changed path')
      paths.push(path)
    }
  }
  if (!paths.length) throw new Error('Empty diff cannot establish scope')
  return [...new Set(paths)]
}

export function plan(paths) {
  if (!paths.length) throw new Error('Empty path set')
  const result = { governance: false, app: false, schema: false, deps: false, disposable: false, tests: 'none' }
  const testGroups = new Set()
  for (const path of paths) {
    if (governance(path)) result.governance = true
    if (dependencies(path)) result.deps = true
    if (schema(path)) result.schema = true
    if (disposable(path)) result.disposable = true
    if (!documentation(path) && !governance(path)) {
      result.app = true
      if (path.startsWith('src/features/travel/') || path.startsWith('src/lib/travel-') ||
        path.startsWith('src/lib/data/travel-') || path.startsWith('content-source/travels/') ||
        path === 'docs/travel-projects.md') testGroups.add('travel')
      else if (path.startsWith('src/features/home/') || path.startsWith('src/features/member/'))
        testGroups.add('frontend')
      else testGroups.add('all')
    }
  }
  if (result.deps || result.schema) result.app = true
  result.tests = testGroups.size === 1 ? [...testGroups][0] : testGroups.size ? 'all' : 'none'
  return result
}

if (process.argv[1]?.endsWith('/plan.mjs')) {
  const [base, head] = process.argv.slice(2)
  if (!/^[0-9a-f]{40}$/.test(base ?? '') || !/^[0-9a-f]{40}$/.test(head ?? '')) {
    throw new Error('Exact base and head SHA required')
  }
  const diff = execFileSync('git', ['diff', '--name-status', '-z', '--find-renames', `${base}...${head}`])
  const paths = changedPaths(diff)
  validateChangedDocs(paths)
  const result = plan(paths)
  const output = `base=${base}\nhead=${head}\n${Object.entries(result).map(([key, value]) => `${key}=${value}`).join('\n')}\n`
  if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT required')
  appendFileSync(process.env.GITHUB_OUTPUT, output)
  console.log(JSON.stringify({ base, head, paths, scope: result }))
}
