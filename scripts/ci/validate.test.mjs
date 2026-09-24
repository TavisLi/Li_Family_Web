import assert from 'node:assert/strict'
import test from 'node:test'
import { validateChangedDocs, validateForm, validateWorkflow } from './validate.mjs'

test('forms require every supplied field', () => {
  const valid = 'name: Work\ndescription: Short\n    id: a\n      required: true\n    id: b\n      required: true\n    id: c\n      required: true\n'
  validateForm(valid)
  assert.throws(() => validateForm(valid.replace('      required: true\n', '')))
})
test('workflows reject unpinned actions and privileged triggers', () => {
  const valid = '  pull_request:\nruns-on: ubuntu-24.04\npersist-credentials: false\nuses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262\n'
  validateWorkflow(valid)
  assert.throws(() => validateWorkflow(valid.replace(/@[0-9a-f]{40}/, '@v4')))
  assert.throws(() => validateWorkflow(valid.replace('pull_request:', 'pull_request_target:')))
})
test('changed Markdown links resolve from their own directory', () => {
  validateChangedDocs(['docs/github-platform-governance.md'])
})
