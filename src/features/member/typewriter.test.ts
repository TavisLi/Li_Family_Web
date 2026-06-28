import assert from 'node:assert/strict'

import {
  initialTypewriterState,
  nextTypewriterState,
  reducedMotionTypewriterWords,
  visibleTypewriterWord,
} from './typewriter'

const words = ['工廠自動化', '數字化轉型']

let state = initialTypewriterState
state = nextTypewriterState({ words, state })
assert.equal(visibleTypewriterWord(words, state), '工')
assert.equal(state.phase, 'typing')

for (let index = 1; index < words[0]!.length; index += 1) {
  state = nextTypewriterState({ words, state })
}

assert.equal(visibleTypewriterWord(words, state), '工廠自動化')
assert.equal(state.phase, 'pausing')

state = nextTypewriterState({ words, state })
assert.equal(state.phase, 'deleting')
assert.equal(visibleTypewriterWord(words, state), '工廠自動化')

for (let index = words[0]!.length; index > 0; index -= 1) {
  state = nextTypewriterState({ words, state })
}

assert.equal(state.phase, 'typing')
assert.equal(state.wordIndex, 1)
assert.equal(visibleTypewriterWord(words, state), '')

assert.equal(reducedMotionTypewriterWords(words), '工廠自動化 / 數字化轉型')
