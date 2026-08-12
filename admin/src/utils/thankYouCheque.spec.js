// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The drawing function has no home of its own: the wallet and the admin share no
// package, so each of them keeps a copy. What the copies must not do is drift. A
// starting bonus printed from the admin and a thank-you cheque printed from the
// wallet end up on the same table, and they have to look like the same object.
//
// What the functions actually do is tested next to the wallet copy, in
// frontend/src/utils/thankYouCheque.spec.js. Running the same cases twice would
// only mean two places to change.

// fileURLToPath is handed the string import.meta.url, never a URL object built here.
// The test environment brings its own URL class, and node rejects an instance of it as
// coming from the wrong realm -- which passes locally and fails in CI.
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

describe('thankYouCheque', () => {
  it('is byte-identical to the wallet copy', () => {
    expect(read('./thankYouCheque.js')).toBe(read('../../../frontend/src/utils/thankYouCheque.js'))
  })
})
