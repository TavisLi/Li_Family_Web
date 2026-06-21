import assert from 'node:assert/strict'

import { memberEnglishLocalizedData, memberLocalizedWriteOptions } from './seed-member-locale'

const options = memberLocalizedWriteOptions()

assert.deepEqual(
  options,
  { locale: 'zh-TW' },
  'member writes must target the default Chinese locale so localized array fields retain their required text',
)

assert.deepEqual(
  memberEnglishLocalizedData(
    {
      displayName: '李天行',
      interests: [{ name: '旅行' }],
    },
    'Tavis Li',
  ),
  {
    displayName: 'Tavis Li',
    interests: [{ name: '旅行' }],
  },
  'English writes must include every required localized member field, not only the display name',
)

console.log('seed member locale tests passed')
