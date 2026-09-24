import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const read = (name) => readFileSync(name, 'utf8')

export function validateForm(source) {
  assert.match(source, /^name: .+$/m)
  assert.match(source, /^description: .+$/m)
  const ids = [...source.matchAll(/^    id: (.+)$/gm)].map(match => match[1])
  assert(ids.length >= 3 && new Set(ids).size === ids.length)
  assert.equal((source.match(/^      required: true$/gm) ?? []).length, ids.length)
}

export function validateWorkflow(source) {
  assert.match(source, /^  pull_request:$/m)
  assert.doesNotMatch(source, /pull_request_target|upload-artifact|actions\/cache|larger-runner/)
  assert.doesNotMatch(source, /\b(?:secrets|environment):/)
  for (const match of source.matchAll(/uses: ([^\s]+)/g)) {
    assert.match(match[1], /^[\w.-]+\/[\w.-]+(?:\/[\w.-]+)?@[0-9a-f]{40}$/)
  }
  assert.match(source, /runs-on: ubuntu-24\.04/)
  assert.match(source, /persist-credentials: false/)
}

export function validateChangedDocs(paths) {
  for (const file of paths) {
    if (!file.endsWith('.md') || !existsSync(file)) continue
    const content = read(file)
    for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1].split('#')[0]
      if (!link || /^(?:https?:|mailto:|#)/.test(link)) continue
      assert(existsSync(path.resolve(path.dirname(file), decodeURIComponent(link))),
        `Broken link in ${file}: ${link}`)
    }
  }
}

if (process.argv[1]?.endsWith('/validate.mjs')) {
  for (const name of ['work', 'production-sensitive']) {
    validateForm(read(`.github/ISSUE_TEMPLATE/${name}.yml`))
  }
  for (const name of ['ci', 'codeql']) validateWorkflow(read(`.github/workflows/${name}.yml`))
  for (const target of [
    'AGENTS.md', 'docs/phase-execution-playbook.md', 'docs/phase-artifacts/issue-105/slice-1-run-contract.md',
    'docs/design/li-family-visual-system.md',
  ]) assert(existsSync(target), `Missing governance owner: ${target}`)
  validateChangedDocs(['docs/github-platform-governance.md'])
  console.log('governance structure validated')
}
