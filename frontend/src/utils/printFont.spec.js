// AI-GENERATED — not an architecture reference

import { afterEach, describe, expect, it, vi } from 'vitest'
import { printFontReady } from './printFont'

// jsdom has no `document.fonts`. Each test hangs in the one it needs and takes it out again.
const withFonts = (load) =>
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load } })

afterEach(() => {
  delete document.fonts
})

describe('printFontReady', () => {
  it('asks for the four weights the drawers use, by the family name alone', async () => {
    const load = vi.fn(async () => [])
    withFonts(load)

    await printFontReady(['Bernd'])

    expect(load.mock.calls.map(([font]) => font)).toEqual([
      '400 16px "Open Sans"',
      '500 16px "Open Sans"',
      '600 16px "Open Sans"',
      '700 16px "Open Sans"',
    ])
  })

  // ⛔ The text decides which subsets of the font are fetched. Without it only the Latin file
  // arrives, and a Greek name stands in the fallback on the first drawing.
  it('hands every text over with every weight, so the right subsets are fetched', async () => {
    const load = vi.fn(async () => [])
    withFonts(load)

    await printFontReady(['Ελένη', 'Привет', 'gradido.net'])

    expect(load).toHaveBeenCalledTimes(4)
    for (const [, text] of load.mock.calls) {
      expect(text).toContain('Ελένη')
      expect(text).toContain('Привет')
      expect(text).toContain('gradido.net')
    }
  })

  it('leaves out what is not a text, and still asks when nothing is left', async () => {
    const load = vi.fn(async () => [])
    withFonts(load)

    await printFontReady([null, undefined, '', 'bernd', 20])
    expect(load.mock.calls[0][1]).toBe('bernd')

    load.mockClear()
    await printFontReady([null, ''])
    expect(load).toHaveBeenCalledTimes(4)
    expect(load.mock.calls[0][1]).toBe(' ')
  })

  it('waits until every weight is there', async () => {
    let arrive
    const last = new Promise((resolve) => {
      arrive = resolve
    })
    withFonts((font) => (font.startsWith('700') ? last : Promise.resolve([])))

    let ready = false
    const waiting = printFontReady(['bernd']).then(() => {
      ready = true
    })
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(ready).toBe(false)

    arrive([])
    await waiting
    expect(ready).toBe(true)
  })

  // ⛔ One weight failing must not end the wait for the others. `Promise.all` gives up at the
  // first rejection; the drawer would then measure while another weight is still on its way,
  // and the first drawing would again differ from the next.
  it('still waits for the other weights when one cannot be loaded', async () => {
    let arrive
    const slow = new Promise((resolve) => {
      arrive = resolve
    })
    withFonts((font) => (font.startsWith('400') ? slow : Promise.reject(new Error('NetworkError'))))

    let ready = false
    const waiting = printFontReady(['bernd']).then(() => {
      ready = true
    })
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(ready).toBe(false)

    arrive([])
    await expect(waiting).resolves.toBeUndefined()
    expect(ready).toBe(true)
  })

  // A missing file makes load() reject. A card in the fallback is better than no card.
  it('does not fail when the font cannot be loaded', async () => {
    const load = vi.fn(() => Promise.reject(new Error('NetworkError')))
    withFonts(load)

    await expect(printFontReady(['bernd'])).resolves.toBeUndefined()
    expect(load).toHaveBeenCalled()
  })

  it('does not fail when load() itself throws', async () => {
    withFonts(() => {
      throw new Error('SyntaxError')
    })

    await expect(printFontReady(['bernd'])).resolves.toBeUndefined()
  })

  it('does not fail where there is no document.fonts at all', async () => {
    expect(document.fonts).toBeUndefined()
    await expect(printFontReady(['bernd'])).resolves.toBeUndefined()
  })

  // The wallet's stylesheet declares the family. A second declaration from here would fetch
  // every file twice.
  it('declares nothing itself', async () => {
    withFonts(async () => [])
    const before = document.head.querySelectorAll('style, link').length

    await printFontReady(['bernd'])

    expect(document.head.querySelectorAll('style, link').length).toBe(before)
  })
})
