// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { CHAT_IMAGE_MAX_BYTES, MESSAGE_MAX_CHARS } from './index'

// A chat message carries its picture and its text in ONE mutation, so the two share the request
// body limit: express is mounted as json() with no argument in backend/src/server/createServer.ts,
// which is 100 KB -- as for the avatar (avatarBudget.test.ts).
const EXPRESS_BODY_LIMIT = 100 * 1024
// Base64 spends four characters on every three bytes, padded up to a multiple of four.
const asBase64 = (bytes: number) => Math.ceil(bytes / 3) * 4
// The most one character of text can cost as the wallet sends it (JSON.stringify), counted the
// way MaxLength counts (validator.js): a control character, which JSON escapes as \u00XX (six
// bytes), followed by a variation selector (three bytes of UTF-8), which validator.js counts
// together with the character before it as one.
const WORST_BYTES_PER_CHARACTER = 9
// The mutation text, the variable names, the recipient's pair, the size of the picture and the
// JSON around them. Measured generously: the real wrapper is a few hundred bytes.
const REQUEST_OVERHEAD = 2 * 1024

describe('chat picture size budget', () => {
  // Raising the picture's limit, or the text's, is exactly the change that would break this, and
  // the breakage would not look like a size problem: express refuses the whole request with a
  // bare 413 before any resolver runs, and the member learns nothing about why.
  it('leaves the largest picture and the longest text room inside the request body limit', () => {
    const worstCase =
      asBase64(CHAT_IMAGE_MAX_BYTES) +
      MESSAGE_MAX_CHARS * WORST_BYTES_PER_CHARACTER +
      REQUEST_OVERHEAD

    expect(worstCase).toBeLessThan(EXPRESS_BODY_LIMIT)
  })
})
