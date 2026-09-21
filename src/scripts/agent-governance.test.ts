import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// Offline Revision 2 regression: reads repository files only; writes fresh evidence below revision-2/evidence.
const revision = 'docs/phase-artifacts/issue-113/revision-2'
const evidence = `${revision}/evidence`
const read = (path: string) => readFileSync(path, 'utf8')
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const candidates = {
  'AGENTS.md': 'draft-core.txt',
  'docs/agent-context-routing.md': 'draft-routing.txt',
  '.claude/CLAUDE.md': 'draft-claude.txt',
} as const
const candidateHashes = {
  'draft-core.txt': '85ed555eec2d6d36abed2e29390e0f2eed5ec7a187b24f926f30cc3656851719',
  'draft-routing.txt': '2635280d3e8f1f6b4269d9068555875b0fe7271ab775c47c467dabc42b744a85',
  'draft-claude.txt': '99a6b5edeaa2cb81b821eb5ccc1f8823705b1d6aea41d3dc578244e4d211e83d',
  'draft-playbook-edits.txt': '36a5a867c1d93e153fb2d79586276b96098da79f4de04c2d4c139ee49f3613d8',
}
const aliases = JSON.parse(read('docs/phase-artifacts/issue-113/slice-2/baseline.json')).aliases as Record<string, string>
const workspaceBefore = JSON.parse(read('docs/phase-artifacts/issue-113/slice-3/workspace-before.json')) as Record<string, string>
const historicalRoots = ['docs/phase-artifacts/issue-113/slice-1', 'docs/phase-artifacts/issue-113/slice-2', 'docs/phase-artifacts/issue-113/slice-3']
const historicalBaseline = Object.fromEntries(Object.entries(workspaceBefore).filter(([path]) => historicalRoots.some(root => path.startsWith(`${root}/`))))
const historicalFiles = historicalRoots.flatMap(root => readdirSync(root, { recursive: true })
  .map(entry => `${root}/${entry}`)
  .filter(path => lstatSync(path).isFile()))
const uncoveredHistoricalFiles = historicalFiles.filter(path => !(path in historicalBaseline))
const historicalCoverage = Object.fromEntries(historicalRoots.map(root => [root, {
  coveredFiles: Object.keys(historicalBaseline).filter(path => path.startsWith(`${root}/`)).length,
  uncoveredFiles: uncoveredHistoricalFiles.filter(path => path.startsWith(`${root}/`)),
}]))
const checks: { name: string; passed: boolean; error?: string }[] = []
const check = (name: string, fn: () => void) => {
  try { fn(); checks.push({ name, passed: true }) }
  catch (error) { checks.push({ name, passed: false, error: String(error) }) }
}
const includes = (text: string, clauses: string[]) => {
  for (const clause of clauses) assert.ok(text.includes(clause), `Missing clause: ${clause}`)
}

check('Revision 2 candidate sources retain approved hashes', () => {
  for (const [name, expected] of Object.entries(candidateHashes)) assert.equal(hash(read(`${revision}/${name}`)), expected, name)
})
check('active core, routing and Claude entry exactly match Revision 2 candidates', () => {
  for (const [target, source] of Object.entries(candidates)) assert.equal(read(target), read(`${revision}/${source}`), target)
})
check('active Playbook exactly matches the approved Revision 2 candidate outcome', () => {
  assert.equal(hash(read('docs/phase-execution-playbook.md')), '4c20888b3510c82ba981f7f53e8ad8d637018e9fac2423bbe6ee23063a99b3a8')
})
check('owner documents, required sections and relative links resolve', () => {
  for (const path of ['AGENTS.md', 'docs/agent-context-routing.md', '.claude/CLAUDE.md', 'docs/phase-execution-playbook.md']) {
    for (const match of read(path).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0]
      if (target && !/^[a-z]+:/.test(target) && !target.startsWith('/')) assert.ok(existsSync(resolve(dirname(path), target)), `${path} -> ${target}`)
    }
  }
  const playbook = read('docs/phase-execution-playbook.md')
  const architecture = read('docs/全栈系统需求与技术架构说明书.md')
  for (const number of [2, 3, 4, 5, 9, 10, 11, 12, 13, 14]) assert.match(playbook, new RegExp(`^## ${number}\\.`, 'm'))
  for (const number of [3, 4, 5, 6, 9, 10, 11]) assert.match(architecture, new RegExp(`^## ${number}\\.`, 'm'))
})
check('Revision 2 removes mandatory preloading without weakening stated safety checks', () => {
  const core = read('AGENTS.md')
  const routing = read('docs/agent-context-routing.md')
  const claude = read('.claude/CLAUDE.md')
  includes(core, ['不預讀清單', '按任務／使用者指定啟用', '不因 UI 小修觸發 redesign／產圖', '不豁免適用要求', 'Build／READY／HTTP 200 非 runtime／data／release 完成證據'])
  includes(routing, ['按需查詢索引，不是開工清單', '只讀選用 Skill 及必要 references', '歷史 evidence 只沿具體待驗證主張查找'])
  includes(claude, ['可選 owner 索引，不是啟動必讀清單', '不新增規則、操作權限或批准流程'])
  for (const text of [core, routing, claude]) for (const clause of ['共同實作路由', '所有實作路由都須讀', '必讀增量']) assert.ok(!text.includes(clause), clause)
})
check('authority, data and stop boundaries remain explicit', () => {
  includes(read('AGENTS.md'), ['獨立授權：GitHub Issue／PRD 發布或修改、本地修改、Preview deployment、Production read-only', 'target、allowed/excluded actions、scope、baseline、環境、stop conditions、有效期間／Phase', 'Scope 外既有 dirty／untracked files／assets 不修改、還原、清理、stage、commit', 'Public／Family access 必須由 collection／data layer 強制', 'Secret 不進 client、log、report、fixture、HTML、Git 或 Issue／PR', '不自行 retry／repair mutation', '#105 擁有 runner／manifest／ledger／receipt／bounded I/O／approval invalidation／Preview QA execution contract'])
})
check('existing Skill aliases remain symlinks', () => {
  for (const [path, target] of Object.entries(aliases)) {
    assert.ok(lstatSync(path).isSymbolicLink(), path)
    assert.equal(readlinkSync(path), target, path)
    assert.ok(existsSync(resolve(dirname(path), target, 'SKILL.md')), path)
  }
})
const verifyHistoricalHashes = (entries: Record<string, string>) => {
  const mismatches = Object.entries(entries).filter(([path, expected]) => !existsSync(path) || hash(readFileSync(path)) !== expected)
  assert.deepEqual(mismatches, [], `Historical evidence mismatch: ${mismatches.map(([path]) => path).join(', ')}`)
}
check('existing workspace-before baseline preserves its covered untracked historical artifacts', () => {
  assert.ok(Object.keys(historicalBaseline).length > 0, 'No historical files covered by existing baseline')
  verifyHistoricalHashes(historicalBaseline)
})
check('historical hash verification detects an untracked-file modification', () => {
  const [path] = Object.keys(historicalBaseline)
  assert.ok(path, 'No baseline fixture for sensitivity probe')
  assert.throws(() => verifyHistoricalHashes({ [path]: '0'.repeat(64) }))
})
check('changed governance surfaces contain no obvious credential signatures', () => {
  const text = [...Object.keys(candidates), 'docs/phase-execution-playbook.md', 'src/scripts/agent-governance.test.ts'].map(read).join('\n')
  for (const pattern of [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, /\bAKIA[A-Z0-9]{16}\b/, /(?:postgres(?:ql)?):\/\/[^\s:@]+:[^\s@]+@/]) assert.ok(!pattern.test(text), `Credential signature: ${pattern}`)
})

mkdirSync(evidence, { recursive: true })
const result = {
  revision: 2,
  runtime: process.version,
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  passed: checks.every(item => item.passed),
  checks,
  historicalEvidence: {
    baseline: 'docs/phase-artifacts/issue-113/slice-3/workspace-before.json',
    coveredFiles: Object.keys(historicalBaseline).length,
    coverageByRoot: historicalCoverage,
    uncoveredFiles: uncoveredHistoricalFiles,
    note: 'Uncovered files were created after the existing snapshot or otherwise absent from it; they are reported, not retroactively treated as protected by a newly created baseline.',
  },
  limitations: ['String and hash checks establish exact candidate application, not semantic equivalence or future model behavior.', 'Relative-link existence does not validate every Markdown anchor.', 'Credential signature checks are non-exhaustive.'],
}
writeFileSync(`${evidence}/structural-results-follow-up.json`, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
if (!result.passed) process.exitCode = 1
