import assert from 'node:assert/strict'

import { Users } from './Users'

const externalProfileUrl = Users.fields.find(
  (field) => 'name' in field && field.name === 'externalProfileUrl',
)

assert.ok(
  externalProfileUrl &&
    externalProfileUrl.type === 'text' &&
    externalProfileUrl.hasMany !== true,
)
assert.equal(externalProfileUrl.required, false)
assert.equal(typeof externalProfileUrl.validate, 'function')

if (typeof externalProfileUrl.validate === 'function') {
  assert.equal(await externalProfileUrl.validate(undefined, {} as never), true)
  assert.equal(
    await externalProfileUrl.validate(
      'https://cancan-lierixia-novel.mjdhdsbcn8.chatgpt.site/zh-Hans',
      {} as never,
    ),
    true,
  )
  assert.notEqual(
    await externalProfileUrl.validate('javascript:alert(1)', {} as never),
    true,
  )
  assert.notEqual(await externalProfileUrl.validate('not-a-url', {} as never), true)
}
