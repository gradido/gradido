// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { AVATAR_FULL_MAX_BYTES, AVATAR_SMALL_MAX_BYTES } from './index'

// The two renditions travel in ONE mutation, so they do not have a budget each -- they
// share the request body limit. express is mounted as json() with no argument in
// backend/src/server/createServer.ts, which is 100 KB.
const EXPRESS_BODY_LIMIT = 100 * 1024
// Base64 spends four characters on every three bytes.
const asBase64 = (bytes: number) => Math.ceil((bytes * 4) / 3)
// The mutation text, the variable names and the JSON around them. Measured generously:
// the real wrapper is a few hundred bytes.
const REQUEST_OVERHEAD = 2 * 1024

describe('avatar size budget', () => {
  // Raising either limit is exactly the change that would break this, and the breakage
  // would not look like a size problem: express rejects the whole request with a bare
  // 413 before any resolver runs, so the member gets no word about which picture was too
  // big -- which is the thing the two limits exist to be able to say.
  it('leaves both renditions room inside the request body limit', () => {
    const worstCase = asBase64(AVATAR_FULL_MAX_BYTES + AVATAR_SMALL_MAX_BYTES) + REQUEST_OVERHEAD

    expect(worstCase).toBeLessThan(EXPRESS_BODY_LIMIT)
  })

  // Not an arbitrary ordering check: the small rendition is the one shown to other people
  // and the one that will cross community borders. If it ever grew to the size of the
  // full one, every list of foreign avatars would pay for it, and the split would have
  // bought nothing.
  it('keeps the everyday rendition far below the full one', () => {
    expect(AVATAR_SMALL_MAX_BYTES * 4).toBeLessThanOrEqual(AVATAR_FULL_MAX_BYTES)
  })
})
