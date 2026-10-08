// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  GENERAL_PREVIEW_FILE,
  THANK_YOU_MOTIFS,
  thankYouMotifPreviewFile,
} from '../../../shared/src/data/ThankYouGreeting.logic'

// The pictures a messenger is shown as the preview of a redeem link are NAMED by the server
// (backend/src/server/redeemPreview.ts writes their address and their measure into the
// document a messenger fetches) and HELD by the wallet, which nginx serves them from as plain
// files. Neither can import the other, and the wallet shows these files nowhere itself.
//
// What drift costs: a file the server names and the wallet does not hold is a preview without
// its picture -- in every chat the link is pasted into, and for good, as a messenger keeps
// what it fetched. Nothing fails where that happens; so the files are held against what the
// server names here.
//
// The backend file is imported directly. It is dependency-free by design, and vitest
// transforms TypeScript on its own, the way thankYouMotifs.drift.spec.js does. ⛔ Nothing else
// of the backend is imported here.

// ⚠️ `fileURLToPath` of the string, never a URL object built here: handed to node's file
// functions, an object of another realm's URL class is turned away.
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public')

/**
 * The measure a JPEG says it has, read off its frame header (the SOF segment: two bytes of
 * length, one of precision, then height and width) -- or null where there is none before the
 * picture's data begins. No decoder: the segments before it are skipped by their lengths.
 */
const measureOfJpeg = (bytes) => {
  let at = 2
  while (at + 9 <= bytes.length && bytes[at] === 0xff) {
    const marker = bytes[at + 1]
    if (marker === 0xda) {
      return null
    }
    // C0 to CF are the frame headers, but for C4, C8 and CC, which are tables and a reserve.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: bytes.readUInt16BE(at + 7), height: bytes.readUInt16BE(at + 5) }
    }
    at += 2 + bytes.readUInt16BE(at + 2)
  }
  return null
}

const named = [
  ...THANK_YOU_MOTIFS.map((motif) => [motif, thankYouMotifPreviewFile(motif)]),
  ['the general picture', GENERAL_PREVIEW_FILE],
]

describe('the pictures the server names for the preview of a redeem link', () => {
  it('are six: one for each motif, and the general one', () => {
    expect(named).toHaveLength(6)
    expect(new Set(named.map(([, { path }]) => path)).size).toBe(6)
    for (const [, { path }] of named) {
      expect(path).toMatch(/^\/img\/[a-z0-9/-]+\.jpg$/)
    }
  })

  it.each(named)('for %s: the file lies where the server says', (_what, { path }) => {
    expect(existsSync(join(publicDir, path))).toBe(true)
  })

  it.each(named)('for %s: it is a JPEG, from its first bytes to its last', (_what, { path }) => {
    const bytes = readFileSync(join(publicDir, path))

    expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff])
    expect([...bytes.subarray(-2)]).toEqual([0xff, 0xd9])
  })

  // WhatsApp draws no picture above 600 KB; these stay far below it.
  it.each(named)('for %s: it stays below 100 KB', (_what, { path }) => {
    expect(readFileSync(join(publicDir, path)).length).toBeLessThan(100000)
  })

  it.each(named)(
    'for %s: it has the measure the server names',
    (_what, { path, width, height }) => {
      expect(measureOfJpeg(readFileSync(join(publicDir, path)))).toEqual({ width, height })
    },
  )

  // The motifs come in the measure of a greeting's own picture, 36 : 25, as the SVGs do.
  it('names the five motifs in one measure, 36 : 25', () => {
    for (const motif of THANK_YOU_MOTIFS) {
      const { width, height } = thankYouMotifPreviewFile(motif)
      expect({ motif, width, height }).toEqual({ motif, width: 1080, height: 750 })
      expect(width * 25).toBe(height * 36)
    }
  })
})
