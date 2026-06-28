'use client'

import React from 'react'
import { useEffect, useState } from 'react'

import {
  initialTypewriterState,
  nextTypewriterState,
  reducedMotionTypewriterWords,
  visibleTypewriterWord,
} from './typewriter'

type MemberTypewriterProps = {
  words: string[]
}

const phaseDurations = {
  deleting: 58,
  pausing: 1080,
  typing: 84,
}

export function MemberTypewriter({ words }: MemberTypewriterProps) {
  const [state, setState] = useState(initialTypewriterState)

  useEffect(() => {
    if (words.length === 0) {
      return
    }

    const timeout = window.setTimeout(() => {
      setState((current) => nextTypewriterState({ words, state: current }))
    }, phaseDurations[state.phase])

    return () => window.clearTimeout(timeout)
  }, [state, words])

  if (words.length === 0) {
    return null
  }

  return (
    <span className="mx-2 inline-grid min-w-[8em] align-bottom text-[#1e3494]">
      <span className="motion-reduce:hidden" aria-hidden="true">
        {visibleTypewriterWord(words, state)}
        <span className="ml-1 inline-block h-[1em] w-px translate-y-1 bg-[#1e3494] animate-pulse" />
      </span>
      <span className="hidden motion-reduce:inline">{reducedMotionTypewriterWords(words)}</span>
      <span className="sr-only">{reducedMotionTypewriterWords(words)}</span>
    </span>
  )
}
