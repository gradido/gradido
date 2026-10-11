// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { CHAT_REACTION_EMOJI_ROWS } from '../../../shared/src/const/frontendReadable'
import { EMOJI_ROWS } from './emojiChoice'

// The wallet's forty-eight emoji exist twice: here, as the choice a member is shown, and in
// `shared`, as the list the backend holds a reaction against (setChatMessageReaction) -- the
// wallet has no dependency on `shared`.
//
// What drift costs: an emoji the wallet offers and the server does not know is refused,
// CHAT_REACTION_NOT_SET: UNKNOWN_EMOJI, and the member reads "could not be saved" for a press on
// something the wallet itself put there. One code point is enough -- the heart with and without
// the selector for its coloured drawing are two different strings to the server.
//
// The file in `shared` is imported directly. It is dependency-free by design, and vitest
// transforms TypeScript on its own, the same way useMemberAvatars.drift.spec.js does.

describe('the emoji a member may react with, on both sides', () => {
  it('are the same here and in the backend, row by row and sign for sign', () => {
    expect(EMOJI_ROWS.map((row) => [...row])).toEqual(CHAT_REACTION_EMOJI_ROWS)
  })

  // Gegenprobe on the comparison: by code point, so a missing selector cannot hide.
  it('are compared code point by code point', () => {
    const points = (rows) => rows.flat().map((emoji) => [...emoji].map((c) => c.codePointAt(0)))
    expect(points(EMOJI_ROWS)).toEqual(points(CHAT_REACTION_EMOJI_ROWS))
    expect(points(EMOJI_ROWS).filter((sign) => sign.length === 2)).toHaveLength(3)
  })
})
