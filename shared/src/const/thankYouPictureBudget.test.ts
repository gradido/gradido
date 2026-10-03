// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { CHAT_IMAGE_MAX_BYTES, MEMO_MAX_CHARS, THANK_YOU_PICTURE_LARGE_MAX_BYTES } from './index'

// Both renditions of a greeting's picture travel as base64 in a mutation, under the request body
// limit: express is mounted as json() with no argument in backend/src/server/createServer.ts,
// which is 100 KB -- as for the avatar (avatarBudget.test.ts) and the chat picture
// (chatImageBudget.test.ts).
const EXPRESS_BODY_LIMIT = 100 * 1024
// Base64 spends four characters on every three bytes, padded up to a multiple of four.
const asBase64 = (bytes: number) => Math.ceil(bytes / 3) * 4
// The most one character of a memo can cost as the wallet sends it (chatImageBudget.test.ts says
// which character that is).
const WORST_BYTES_PER_CHARACTER = 9
// The mutation text, the variable names, the link's id, the size of the picture and the JSON
// around them. Measured generously: the real wrapper is a few hundred bytes.
const REQUEST_OVERHEAD = 2 * 1024

describe('thank-you greeting picture size budget', () => {
  // Raising the large rendition's limit is exactly the change that would break this, and the
  // breakage would not look like a size problem: express refuses the whole request with a bare
  // 413 before any resolver runs.
  it('leaves the largest large rendition room inside the request body limit, alone', () => {
    expect(asBase64(THANK_YOU_PICTURE_LARGE_MAX_BYTES) + REQUEST_OVERHEAD).toBeLessThan(
      EXPRESS_BODY_LIMIT,
    )
  })

  // The small rendition comes with the link: beside its memo, the line and the name.
  it('leaves the largest small rendition and the longest memo room in the request that makes the link', () => {
    const worstCase =
      asBase64(CHAT_IMAGE_MAX_BYTES) +
      // The memo, and its first line a second time in the greeting.
      2 * MEMO_MAX_CHARS * WORST_BYTES_PER_CHARACTER +
      REQUEST_OVERHEAD

    expect(worstCase).toBeLessThan(EXPRESS_BODY_LIMIT)
  })

  // Why the large one comes in a second request (and why this is no place to save one).
  it('does not fit both renditions into one request', () => {
    expect(
      asBase64(CHAT_IMAGE_MAX_BYTES) + asBase64(THANK_YOU_PICTURE_LARGE_MAX_BYTES),
    ).toBeGreaterThan(EXPRESS_BODY_LIMIT)
  })
})
