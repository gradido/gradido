// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The QR generator has no home of its own: the wallet and the admin share no package,
// so each of them keeps a copy. What the copies must not do is drift. A code scanned
// off a printed cheque has to be the same code either application put on screen, and
// that only holds while the settings in both files stay the same.
//
// What the functions actually do is tested next to the admin copy, in
// admin/src/utils/qrCode.spec.js. Running the same cases twice would only mean two
// places to change.

// fileURLToPath is handed the string import.meta.url, never a URL object built here.
// The test environment brings its own URL class, and node rejects an instance of it as
// coming from the wrong realm -- which passes locally and fails in CI.
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

describe('qrCode', () => {
  it('is byte-identical to the admin copy', () => {
    expect(read('./qrCode.js')).toBe(read('../../../admin/src/utils/qrCode.js'))
  })
})
