// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import AuthTriads from './AuthTriads.vue'
import de from '@/locales/de.json'

const INTERVAL_MS = 7000

const SLOGAN = ['Helfen.', 'Schenken.', 'Danken.']
const DESIGN = ['Gemeinschaftsbasiert.', 'Dezentral.', 'Open Source.']
const PURPOSE = ['Für Dich und mich.', 'Für die Gemeinschaft.', 'Für die Natur.']

const partsOf = (element) => element.findAll('.triad-part').map((part) => part.text())

describe('AuthTriads', () => {
  let wrapper

  const createWrapper = () =>
    mount(AuthTriads, {
      global: {
        // The real German file: a key the component asks for that the file does not carry
        // would show up here as its key path instead of the text.
        plugins: [createI18n({ legacy: false, locale: 'de', messages: { de } })],
      },
    })

  const shownParts = () => partsOf(wrapper.find('.triad:not(.triad-sizer)'))

  const focusIn = (tagName) => {
    const element = document.createElement(tagName)
    document.body.appendChild(element)
    element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    element.remove()
  }

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = createWrapper()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('opens with the slogan', () => {
    expect(shownParts()).toEqual(SLOGAN)
  })

  // The stage takes the height of what it holds. Without all three laid out in it, it would
  // grow and shrink with every change, and the form below would jump while somebody types.
  it('lays out every triad invisibly, so the stage is as tall as the tallest one', () => {
    const sizers = wrapper.findAll('[data-test="triad-sizer"]')

    expect(sizers.map((sizer) => partsOf(sizer))).toEqual([SLOGAN, DESIGN, PURPOSE])
    expect(wrapper.find('[data-test="triad-stage"]').attributes('aria-hidden')).toBe('true')
  })

  it('gives screen readers every part once, outside the moving stage', () => {
    const spoken = wrapper.find('[data-test="triads-spoken"]')

    expect(spoken.text()).toBe([...SLOGAN, ...DESIGN, ...PURPOSE].join(' '))
    expect(spoken.classes()).toContain('visually-hidden')
    expect(spoken.element.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('keeps a triad for the whole interval before the next one comes', async () => {
    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 1)
    expect(shownParts()).toEqual(SLOGAN)

    await vi.advanceTimersByTimeAsync(1)
    expect(shownParts()).toEqual(DESIGN)
  })

  it('goes through two rounds and then stays on the slogan', async () => {
    await vi.advanceTimersByTimeAsync(5 * INTERVAL_MS)
    expect(shownParts()).toEqual(PURPOSE)

    await vi.advanceTimersByTimeAsync(INTERVAL_MS)
    expect(shownParts()).toEqual(SLOGAN)

    await vi.advanceTimersByTimeAsync(10 * INTERVAL_MS)
    expect(shownParts()).toEqual(SLOGAN)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stops where it is as soon as somebody is in a form field', async () => {
    await vi.advanceTimersByTimeAsync(INTERVAL_MS)
    expect(shownParts()).toEqual(DESIGN)

    focusIn('input')
    await vi.advanceTimersByTimeAsync(10 * INTERVAL_MS)

    expect(shownParts()).toEqual(DESIGN)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps turning when the focus lands on something that is not a form field', async () => {
    focusIn('button')
    await vi.advanceTimersByTimeAsync(INTERVAL_MS)

    expect(shownParts()).toEqual(DESIGN)
  })

  it('does not use up the rounds while the tab is in the background', async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    try {
      await vi.advanceTimersByTimeAsync(10 * INTERVAL_MS)
      expect(shownParts()).toEqual(SLOGAN)
    } finally {
      delete document.hidden
    }

    await vi.advanceTimersByTimeAsync(INTERVAL_MS)
    expect(shownParts()).toEqual(DESIGN)
  })

  it('leaves no timer behind when the page goes', () => {
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)

    // afterEach unmounts again; a fresh wrapper keeps that harmless.
    wrapper = createWrapper()
  })

  // Layout lives in the stylesheet, and jsdom lays nothing out. These are the lines that
  // carry the promise of the tests above on a real screen.
  describe('the stylesheet', () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'AuthTriads.vue'),
      'utf8',
    )
    // Comments name the same properties; only declarations may count.
    const css = source
      .slice(source.indexOf('<style'), source.indexOf('</style>'))
      .replace(/\/\*[\s\S]*?\*\//g, '')

    it('puts all triads into one grid cell', () => {
      expect(css).toMatch(/\.triad-stage > \*\s*\{[^}]*grid-area:\s*1 \/ 1;/)
      expect(css).toMatch(/\.triad-sizer\s*\{[^}]*visibility:\s*hidden;/)
    })

    // Bernd, 21.09.2026: with the wider card a phone has room for a triad on one line. Where
    // one does not fit, it breaks between two parts, and the stage keeps the tallest one's
    // height: two lines on a phone instead of three.
    it('lines the parts up on every width and breaks only between them', () => {
      const triad = css.match(/\n\.triad\s*\{([^}]*)\}/)
      expect(triad).not.toBeNull()
      expect(triad[1]).toMatch(/flex-flow:\s*row wrap;/)
      expect(triad[1]).toMatch(/column-gap:\s*0\.3em;/)
      // Wrapped lines stay together in the middle of a stage made for a taller triad.
      expect(triad[1]).toMatch(/place-content:\s*center;/)
      expect(css).not.toMatch(/flex-direction:\s*column/)
      // No width switches the shape any more.
      expect(css).not.toMatch(/@media[^{]*\{\s*\.triad\s*\{/)
    })

    it('fades instead of sliding when the device asks for less motion', () => {
      expect(css).toMatch(
        /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?transform:\s*none;\s*opacity:\s*0;/,
      )
    })
  })
})
