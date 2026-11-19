// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The colour rule has no home of its own either: the wallet and the admin share no
// package, and thankYouCheque.ts needs it in both. What the copies must not do is
// drift -- a member whose initials are blue in the wallet must not be brown on a
// printed cheque.
//
// What the rule actually does is tested next to the wallet copy, in
// frontend/src/utils/avatarColor.spec.js.

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath: string) => readFileSync(resolve(here, relativePath), 'utf8')

describe('avatarColor', () => {
  it('is byte-identical to the wallet copy', () => {
    expect(read('./avatarColor.ts')).toBe(read('../../../frontend/src/utils/avatarColor.ts'))
  })
})
