// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * `showFriends` takes no arguments, so apollo keeps ONE cache entry for everybody on this
 * device. Signing out empties the store; `cache-and-network` is the second lock, for the
 * ways a member changes without that happening. Without it the tile would show the
 * previous member's arrival, by name.
 *
 * ⛔ Read as SOURCE rather than behaviour on purpose: a fetch policy is a value handed to
 * a library, and every spec that mounts these two components mocks that library away. The
 * option can be deleted with the whole suite green -- which is what this file is for.
 *
 * ⚠️ Comments stripped FIRST. Both files explain the policy in prose, so a guard that
 * searched the raw text would find its own explanation and stay green over a deletion.
 */
const HERE = dirname(fileURLToPath(import.meta.url))

const CALLERS = [
  join(HERE, '..', 'components', 'Overview', 'ShowFriendsTile.vue'),
  join(HERE, '..', 'components', 'FirstCreation.vue'),
]

const withoutComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')

describe('the referral trace is never read out of the cache alone', () => {
  it.each(CALLERS)('%s asks the network as well', (file) => {
    const code = withoutComments(readFileSync(file, 'utf8'))

    // The call itself, not merely the words somewhere in the file.
    expect(code).toMatch(/useQuery\(\s*showFriends[\s\S]{0,120}?cache-and-network/)
  })

  // The control: with the comments left in, the raw text would carry the phrase anyway.
  it('would not be satisfied by the prose around it', () => {
    const raw = readFileSync(CALLERS[0], 'utf8')

    expect(raw).toContain('cache-and-network')
    expect(withoutComments(raw).match(/cache-and-network/g)).toHaveLength(1)
  })
})
