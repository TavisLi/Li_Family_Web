export type TypewriterPhase = 'typing' | 'pausing' | 'deleting'

export type TypewriterState = {
  phase: TypewriterPhase
  wordIndex: number
  visibleLength: number
}

export type TypewriterStepConfig = {
  words: string[]
  state: TypewriterState
}

export const initialTypewriterState: TypewriterState = {
  phase: 'typing',
  wordIndex: 0,
  visibleLength: 0,
}

export function visibleTypewriterWord(words: string[], state: TypewriterState): string {
  const word = words[state.wordIndex] ?? ''

  return word.slice(0, state.visibleLength)
}

export function reducedMotionTypewriterWords(words: string[]): string {
  return words.filter(Boolean).join(' / ')
}

export function nextTypewriterState({ words, state }: TypewriterStepConfig): TypewriterState {
  if (words.length === 0) {
    return initialTypewriterState
  }

  const wordIndex = state.wordIndex < words.length ? state.wordIndex : 0
  const word = words[wordIndex] ?? ''

  if (state.phase === 'typing') {
    const nextLength = Math.min(state.visibleLength + 1, word.length)

    return {
      phase: nextLength >= word.length ? 'pausing' : 'typing',
      visibleLength: nextLength,
      wordIndex,
    }
  }

  if (state.phase === 'pausing') {
    return {
      phase: 'deleting',
      visibleLength: word.length,
      wordIndex,
    }
  }

  const nextLength = Math.max(state.visibleLength - 1, 0)

  if (nextLength > 0) {
    return {
      phase: 'deleting',
      visibleLength: nextLength,
      wordIndex,
    }
  }

  return {
    phase: 'typing',
    visibleLength: 0,
    wordIndex: (wordIndex + 1) % words.length,
  }
}
