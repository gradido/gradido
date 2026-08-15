// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The colour rule has no home of its own either: the wallet and the admin share no
// package, and thankYouCheque.js needs it in both. What the copies must not do is
// drift -- a member whose initials are blue in the wallet must not be brown on a
// printed cheque.
//
// What the rule actually does is tested next to the wallet copy, in
// frontend/src/utils/avatarColor.spec.js.

// fileURLToPath is handed the string import.meta.url, never a URL object built here.
// The test environment brings its own URL class, and node rejects an instance of it as
// coming from the wrong realm -- which passes locally and fails in CI.
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

describe('avatarColor', () => {
  it('is byte-identical to the wallet copy', () => {
    expect(read('./avatarColor.js')).toBe(read('../../../frontend/src/utils/avatarColor.js'))
  })
})
