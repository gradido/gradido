// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import ChatWindowSizeToggle from './ChatWindowSizeToggle.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))

const storeState = vi.hoisted(() => ({ gradidoID: 'me-id' }))
vi.mock('vuex', () => ({ useStore: () => ({ state: storeState }) }))

const KEY = 'chat-window-large:me-id'

describe('ChatWindowSizeToggle', () => {
  let wrapper

  const mountToggle = () => {
    wrapper = mount(ChatWindowSizeToggle, {
      global: { stubs: { IMdiArrowExpand: true, IMdiArrowCollapse: true } },
    })
    return wrapper
  }
  const button = () => wrapper.find('[data-test="chat-window-size"]')

  beforeEach(() => {
    window.localStorage.clear()
    storeState.gradidoID = 'me-id'
  })

  afterEach(() => {
    wrapper?.unmount()
    window.localStorage.clear()
  })

  it('offers to enlarge the usual window', () => {
    mountToggle()
    expect(button().attributes('aria-label')).toBe('chatWindow.enlarge')
    expect(button().attributes('title')).toBe('chatWindow.enlarge')
    expect(wrapper.find('i-mdi-arrow-expand-stub').exists()).toBe(true)
    expect(wrapper.find('i-mdi-arrow-collapse-stub').exists()).toBe(false)
  })

  it('offers to reduce the large one', () => {
    window.localStorage.setItem(KEY, '1')
    mountToggle()
    expect(button().attributes('aria-label')).toBe('chatWindow.reduce')
    expect(button().attributes('title')).toBe('chatWindow.reduce')
    expect(wrapper.find('i-mdi-arrow-collapse-stub').exists()).toBe(true)
    expect(wrapper.find('i-mdi-arrow-expand-stub').exists()).toBe(false)
  })

  it('turns the window with a press, and back with the next', async () => {
    mountToggle()

    await button().trigger('click')
    expect(button().attributes('aria-label')).toBe('chatWindow.reduce')
    expect(window.localStorage.getItem(KEY)).toBe('1')

    await button().trigger('click')
    expect(button().attributes('aria-label')).toBe('chatWindow.enlarge')
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  // The same element before and after: the keyboard that pressed it stays on it.
  it('stays the same button through the change', async () => {
    mountToggle()
    const before = button().element
    await button().trigger('click')
    expect(button().element).toBe(before)
  })

  /**
   * Its name says what a press does and follows the state. A pressed state beside it would say
   * the same thing a second time, and differently ("reduce window, pressed").
   */
  it('is a plain button whose name carries the state', async () => {
    mountToggle()
    expect(button().attributes('type')).toBe('button')
    expect(button().attributes('aria-pressed')).toBeUndefined()
    await button().trigger('click')
    expect(button().attributes('aria-pressed')).toBeUndefined()
    // The glyph is for the eye only.
    expect(wrapper.find('i-mdi-arrow-collapse-stub').attributes('aria-hidden')).toBe('true')
  })

  describe('its stylesheet', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    /**
     * A component's style blocks: whether each is scoped, and its rules with the comments taken
     * out -- prose names the rules too. Read from behind the opening tag: read with it, the first
     * rule's selector would begin with the tag's attributes.
     */
    const stylesOf = (file) =>
      readFileSync(join(here, file), 'utf8')
        .split('<style')
        .slice(1)
        .map((block) => {
          const tagEnds = block.indexOf('>')
          return {
            scoped: /\bscoped\b/.test(block.slice(0, tagEnds)),
            css: block.slice(tagEnds + 1).replace(/\/\*[\s\S]*?\*\//g, ''),
          }
        })
    /** The declarations of every rule of a block, by selector, sorted. */
    const rulesOf = (css) => {
      const rules = new Map()
      for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const declarations = body
          .split(';')
          .map((part) => part.trim().replace(/\s+/g, ' '))
          .filter(Boolean)
          .sort()
          .join('; ')
        for (const selector of selectors.split(',')) rules.set(selector.trim(), declarations)
      }
      return rules
    }
    /** The blocks of a media query: `[condition, css inside]`, in the order they stand. */
    const mediaOf = (css) => {
      const blocks = []
      for (const match of css.matchAll(/@media\s*([^{]+)\{/g)) {
        let depth = 1
        let at = match.index + match[0].length
        const from = at
        while (depth > 0 && at < css.length) {
          if (css[at] === '{') depth += 1
          if (css[at] === '}') depth -= 1
          at += 1
        }
        blocks.push([match[1].trim(), css.slice(from, at - 1)])
      }
      return blocks
    }

    /** A block without its media queries: the rules that hold at every width. */
    const outsideMedia = (css) => css.replace(/@media[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')

    const [button, measure] = stylesOf('ChatWindowSizeToggle.vue')
    const scoped = button.css
    const unscoped = measure.css

    // The magnifier stands beside it: the two are drawn alike, or the line of three looks patched.
    it('draws the button as the magnifier beside it is drawn', () => {
      const own = rulesOf(outsideMedia(scoped))
      const [contact] = stylesOf('../Contacts/ContactWindow.vue')
      const theirs = rulesOf(outsideMedia(contact.css))
      expect(theirs.get('.contact-window-search-toggle')).toBeTruthy()
      expect(own.get('.chat-window-size-toggle')).toBe(theirs.get('.contact-window-search-toggle'))
      expect(own.get('.chat-window-size-toggle:hover')).toBe(
        theirs.get('.contact-window-search-toggle:hover'),
      )
      expect(own.get('.chat-window-size-toggle:focus-visible')).toBe(
        theirs.get('.contact-window-search-toggle:focus-visible'),
      )
    })

    // Below `sm` the window is a sheet over the whole screen: nothing to enlarge.
    it('is not there on the sheet', () => {
      const sheet = mediaOf(scoped).filter(([condition]) => condition === '(width <= 575.98px)')
      expect(sheet).toHaveLength(1)
      expect(rulesOf(sheet[0][1]).get('.chat-window-size-toggle')).toBe('display: none')
    })

    /**
     * The dialog, its content and its body are BModal's own elements, teleported to the body: a
     * scoped rule never reaches them. The button's own rules stay scoped.
     */
    it('keeps the measure of the large window out of its own scope', () => {
      expect(button.scoped).toBe(true)
      expect(measure.scoped).toBe(false)
      expect(scoped).not.toContain('chat-window-large')
      expect(unscoped).not.toContain('chat-window-size-toggle')
    })

    /**
     * ⛔ Everything about the large window applies from `sm` up only -- below it the window is a
     * sheet, and a rule outside a media query would reach it there.
     */
    it('measures the large window from `sm` up only', () => {
      expect(outsideMedia(unscoped)).not.toContain('{')
      for (const [condition] of mediaOf(unscoped)) {
        expect(condition).toMatch(/^\(width >= 576px\)/)
      }
    })

    /**
     * ⛔ Every rule names Bootstrap's own class together with ours. On its own, ours would stand
     * level with Bootstrap's rule for the same element, and which of two level rules holds is
     * decided by the order the stylesheets load in.
     */
    it("names Bootstrap's class with its own in every rule", () => {
      const selectors = mediaOf(unscoped).flatMap(([, css]) => [...rulesOf(css).keys()])
      expect(selectors.length).toBeGreaterThan(0)
      for (const selector of selectors) {
        expect(selector).toMatch(/^\.modal-dialog\.chat-window-large(?:$| > \.modal-content)/)
      }
    })

    it('is wide from `sm` up, and never to the edge of the screen', () => {
      const wide = mediaOf(unscoped).filter(([condition]) => condition === '(width >= 576px)')
      expect(wide).toHaveLength(1)
      expect(rulesOf(wide[0][1]).get('.modal-dialog.chat-window-large')).toBe(
        'max-width: min(64rem, calc(100% - var(--bs-modal-margin) * 2))',
      )
    })

    /**
     * As high as the screen lets it be, the thread giving way inside -- but only where the screen
     * is high enough for head, thread and compose bar. On a low one the large window is wide
     * only: the thread keeps its cap, and the page scrolls as it always did.
     */
    it('is high only where the screen is high enough', () => {
      const high = mediaOf(unscoped).filter(
        ([condition]) => condition === '(width >= 576px) and (height >= 704px)',
      )
      expect(high).toHaveLength(1)
      const rules = rulesOf(high[0][1])
      expect(rules.get('.modal-dialog.chat-window-large')).toBe(
        'height: calc(100% - var(--bs-modal-margin) * 2)',
      )
      expect(rules.get('.modal-dialog.chat-window-large > .modal-content')).toBe(
        'max-height: 100%; overflow: hidden',
      )
      expect(rules.get('.modal-dialog.chat-window-large > .modal-content > .modal-body')).toBe(
        'display: flex; flex-direction: column; min-height: 0; overflow-y: auto',
      )
      // No height outside that block.
      const [wide] = mediaOf(unscoped).filter(([condition]) => condition === '(width >= 576px)')
      expect(wide[1]).not.toMatch(/(?:^|[\s;{])(?:max-)?height\s*:/)
    })
  })
})
