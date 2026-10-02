// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import {
  memoBeginsWithLine,
  THANK_YOU_LINE_MAX_CHARS as SERVER_LINE_MAX,
  THANK_YOU_RECIPIENT_NAME_MAX_CHARS as SERVER_NAME_MAX,
} from '../../../backend/src/data/ThankYouGreeting.logic'
import {
  greetingMemo,
  greetingParts,
  THANK_YOU_LINE_MAX_CHARS,
  THANK_YOU_RECIPIENT_NAME_MAX_CHARS,
} from './thankYouGreeting'

// The rules of a greeting exist twice: in the backend, which refuses what breaks them, and
// here, where the fields stop at the same lengths and the memo is put together. The wallet has
// no dependency on the backend.
//
// What drift costs: a field that lets in more than the server takes ends in an error on the
// last step, after everything was written. A memo put together differently from what the
// server checks is refused for every greeting with a line.
//
// The backend file is imported directly. It is dependency-free by design, and vitest
// transforms TypeScript on its own, the way useMemberAvatars.drift.spec.js does.

describe('the lengths of a thank-you greeting on both sides', () => {
  it('are the same numbers here and in the backend', () => {
    expect(THANK_YOU_LINE_MAX_CHARS).toBe(SERVER_LINE_MAX)
    expect(THANK_YOU_RECIPIENT_NAME_MAX_CHARS).toBe(SERVER_NAME_MAX)
  })
})

describe('the memo of a thank-you greeting on both sides', () => {
  const LINE = 'Danke für Deine Hilfe!'
  const MEMOS = [
    [LINE, 'Ohne Dich stünde die Bank noch schief.'],
    [LINE, 'Liebe Sarah,\n\nes war schön.\nDeine Oma'],
    [LINE, ''],
    [`  ${LINE} `, '\n  Mit Rand ringsum  \n'],
  ]

  it('is put together here the way the server asks for it', () => {
    for (const [line, words] of MEMOS) {
      expect(memoBeginsWithLine(greetingMemo(line, words), line.trim())).toBe(true)
    }
  })

  // The card cuts the line off where the server says it ends: one rule, read from both ends.
  it('is taken apart here exactly where the server says it begins with the line', () => {
    for (const memo of [
      LINE,
      `${LINE}\nWorte`,
      `${LINE}\n\nWorte`,
      `${LINE}\n`,
      `${LINE} Worte`,
      `Worte\n${LINE}`,
      `${LINE}\r\nWorte`,
    ]) {
      expect(greetingParts(memo, LINE).line !== null, JSON.stringify(memo)).toBe(
        memoBeginsWithLine(memo, LINE),
      )
    }
  })
})
