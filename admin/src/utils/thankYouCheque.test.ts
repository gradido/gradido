// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'
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

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath: string) => readFileSync(resolve(here, relativePath), 'utf8')

describe('thankYouCheque', () => {
  it('is byte-identical to the wallet copy', () => {
    expect(read('./thankYouCheque.ts')).toBe(read('../../../frontend/src/utils/thankYouCheque.ts'))
  })
})
