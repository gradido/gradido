// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CHAT_IMAGE_MAX_SIDE } from './chatImage'
import { THANK_YOU_MOTIF_HEIGHT, THANK_YOU_MOTIF_WIDTH } from './thankYouMotifs'
import {
  THANK_YOU_PICTURE_FRAME,
  THANK_YOU_PICTURE_GROUND,
  THANK_YOU_PICTURE_LARGE,
  THANK_YOU_PICTURE_SMALL,
  thankYouPictureAddress,
} from './thankYouPicture'

// The photo of a thank-you greeting is described in three places that do not know of each other:
// the wallet makes it (this folder), the server takes and serves it (`shared`, `backend`), and
// the stylesheets of the places that show it give its room a colour. The wallet depends on
// neither `shared` nor the backend.
//
// What drift costs:
// - a rendition made larger than the server takes is a greeting that cannot be made, or -- for
//   the large one -- a card that silently shows the small rendition;
// - an address the server does not serve is a card without its picture;
// - a ground that is not the colour of the place shows as an edge around a photo that was fitted
//   in whole: the margin is part of the picture, and it has to vanish into the place.
//
// ⚠️ Read as text, not imported: `shared` loads a native binding with its first line, and the
// backend's files reach for the database. And `fileURLToPath`, not `new URL(...)`: jsdom brings
// its own `URL` class, and node turns an instance of it away as coming from another realm.
const here = dirname(fileURLToPath(import.meta.url))
const read = (...path) => readFileSync(join(here, ...path), 'utf8')
const repo = (...path) => read('..', '..', '..', ...path)

/** `export const NAME = <product of numbers>` in a file, reckoned. */
const numberIn = (text, name) => {
  const [, value] = text.match(new RegExp(`^export const ${name} = ([0-9_ *]+)$`, 'm')) ?? []
  // The fixture has to prove itself: no match would compare a number with nothing.
  expect(value, name).toBeDefined()
  return value
    .replace(/_/g, '')
    .split('*')
    .reduce((product, factor) => product * Number(factor), 1)
}

describe('the two renditions against what the server takes', () => {
  const shared = repo('shared', 'src', 'const', 'index.ts')

  it('aims the small one below the bound of a chat picture', () => {
    expect(THANK_YOU_PICTURE_SMALL.targetBytes).toBeLessThan(
      numberIn(shared, 'CHAT_IMAGE_MAX_BYTES'),
    )
    expect(THANK_YOU_PICTURE_SMALL.area).toBeLessThanOrEqual(
      numberIn(shared, 'CHAT_IMAGE_MAX_PIXELS'),
    )
  })

  it('aims the large one below the bound the server has for it', () => {
    expect(THANK_YOU_PICTURE_LARGE.targetBytes).toBeLessThan(
      numberIn(shared, 'THANK_YOU_PICTURE_LARGE_MAX_BYTES'),
    )
    expect(THANK_YOU_PICTURE_LARGE.area).toBeLessThanOrEqual(
      numberIn(shared, 'THANK_YOU_PICTURE_LARGE_MAX_PIXELS'),
    )
  })

  // 1080 x 750 rounded up in either direction by a pixel still fits.
  it('leaves the large one room for the rounding of its sides', () => {
    expect(1081 * 751).toBeLessThanOrEqual(numberIn(shared, 'THANK_YOU_PICTURE_LARGE_MAX_PIXELS'))
  })

  it('keeps each side within the bound both renditions share', () => {
    expect(CHAT_IMAGE_MAX_SIDE).toBe(numberIn(shared, 'CHAT_IMAGE_MAX_SIDE'))
  })

  // The large one as base64 has to fit into one request: the server takes up to 100 KB.
  it('makes the large one fit into one request as base64', () => {
    const asBase64 = Math.ceil(numberIn(shared, 'THANK_YOU_PICTURE_LARGE_MAX_BYTES') / 3) * 4
    expect(asBase64).toBeLessThan(100 * 1024)
  })
})

describe('the address of the picture on both sides', () => {
  const CODE = 'a3f9c2d41b7e19981fa0c4e2'

  it('is the path the server serves, and the code after it', () => {
    const [, path] =
      repo('backend', 'src', 'server', 'thankYouGreetingPicture.ts').match(
        /^export const THANK_YOU_GREETING_PICTURE_PATH = '([^']+)'$/m,
      ) ?? []

    expect(path).toBeDefined()
    expect(new URL(thankYouPictureAddress(CODE)).pathname).toBe(`${path}/${CODE}`)
  })

  it('takes the form of a code the server takes', () => {
    const [, form] =
      repo('backend', 'src', 'data', 'ThankYouGreetingPicture.logic.ts').match(
        /typeof text === 'string' && (\/\^.+\$\/i?)\.test\(text\)/,
      ) ?? []
    const [, ours] =
      read('thankYouPicture.js').match(
        /typeof code !== 'string' \|\| !(\/\^.+\$\/i?)\.test\(code\)/,
      ) ?? []

    expect(form).toBeDefined()
    expect(ours).toBe(form)
  })
})

describe('the ground of a photo against the places that show it', () => {
  it('is the frame of the motifs', () => {
    expect(THANK_YOU_PICTURE_FRAME).toBe(THANK_YOU_MOTIF_WIDTH / THANK_YOU_MOTIF_HEIGHT)
  })

  /** The block of the first rule in a stylesheet whose selector ends with the one given. */
  const rule = (file, selector) => {
    const code = read('..', ...file).replace(/\/\*[\s\S]*?\*\//g, '')
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return code.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)`))?.[1]
  }

  // ⛔ The card first of all: `.redeem-thanks-paper-picture` is the place the colour is named
  // after. The others show the same picture smaller.
  it.each([
    [
      'the card',
      ['components', 'LinkInformations', 'RedeemThanksPaper.vue'],
      '.redeem-thanks-paper-picture',
    ],
    [
      'the tile of the choice',
      ['components', 'ThankYouGreeting', 'ThankYouPictureChoice.vue'],
      '.tyg-motif img',
    ],
    ['"Fertig"', ['components', 'ThankYouGreeting', 'ThankYouGreetingDone.vue'], '.tyg-done-motif'],
    [
      'the strip over the account form',
      ['components', 'LinkInformations', 'RedeemThanksAccount.vue'],
      '.redeem-thanks-strip-picture.is-photo',
    ],
    [
      'the list of links',
      ['components', 'TransactionLinks', 'TransactionLink.vue'],
      '.transaction-link-greeting-motif',
    ],
    ['the bubble', ['components', 'Chat', 'ChatBubble.vue'], '.chat-bubble-greeting-picture'],
  ])('is the colour %s gives the room of its picture', (name, file, selector) => {
    const block = rule(file, selector)

    expect(block, selector).toBeDefined()
    expect(block).toMatch(/aspect-ratio:\s*36 \/ 25/)
    expect(block.match(/background:\s*([^;]+);/)?.[1]).toBe(THANK_YOU_PICTURE_GROUND)
  })
})
