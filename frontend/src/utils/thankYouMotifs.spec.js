// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_KEYS,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
  thankYouMotifs,
} from './thankYouMotifs'

// ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
// instance of it away as coming from another realm.
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public')

// The key it was asked for, so that a name can only have come from its own key.
const t = (key) => `<${key}>`

describe('thankYouMotif', () => {
  it('gives each of the five its picture and its name', () => {
    expect(thankYouMotif('heart-leaves', t)).toEqual({
      key: 'heart-leaves',
      src: '/img/thank-you-greeting/heart-leaves.svg',
      name: '<thank-you-greeting.motif.heart-leaves>',
    })
    expect(thankYouMotifs(t).map((motif) => motif.key)).toEqual(THANK_YOU_MOTIF_KEYS)
    for (const motif of thankYouMotifs(t)) {
      expect(motif.src).toBe(`/img/thank-you-greeting/${motif.key}.svg`)
      expect(motif.name).toBe(`<thank-you-greeting.motif.${motif.key}>`)
    }
  })

  it('gives no picture for a key it does not know, and none for no key', () => {
    for (const key of ['sunset', '', null, undefined, 'Heart-Leaves', 'heart-leaves.svg', '../x']) {
      expect(thankYouMotif(key, t)).toBeNull()
    }
  })
})

describe('the pictures in public/img/thank-you-greeting', () => {
  it('are there, one for every key, in the size the card keeps room for', () => {
    for (const key of THANK_YOU_MOTIF_KEYS) {
      const file = join(publicDir, 'img', 'thank-you-greeting', `${key}.svg`)
      expect(existsSync(file), key).toBe(true)
      expect(readFileSync(file, 'utf8'), key).toContain(
        `viewBox="0 0 ${THANK_YOU_MOTIF_WIDTH} ${THANK_YOU_MOTIF_HEIGHT}"`,
      )
    }
  })

  // An <img> runs no script and follows no link; the files should not carry one either.
  it('carry no script, no handler and no address outside themselves', () => {
    for (const key of THANK_YOU_MOTIF_KEYS) {
      const svg = readFileSync(join(publicDir, 'img', 'thank-you-greeting', `${key}.svg`), 'utf8')
      expect(svg, key).not.toMatch(/<script|\son[a-z]+=|<foreignObject|<image/i)
      for (const [, target] of svg.matchAll(/href="([^"]*)"/g)) {
        expect(target, key).toMatch(/^#/)
      }
      expect(svg, key).not.toMatch(/url\((?!#)/)
    }
  })
})
