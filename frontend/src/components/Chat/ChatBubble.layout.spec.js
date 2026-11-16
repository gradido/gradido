// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * Rules of ChatBubble's stylesheet that the test library cannot see -- jsdom lays nothing out --,
 * read from the source, as darkModeLinkGreen.spec.js reads its colours:
 * - own messages on the right, the other person's on the left (E-014). Both rules went missing once
 *   when the bubble's rules were put in a new order for the menu at a message (E-059), and every
 *   own message stood on the left; the probe found it, no test did.
 * - the name in "Weitergeleitet von …" a box of its own (E-059 F2): where the line is too narrow
 *   the name moves on whole instead of breaking at its hyphen ("Carla-" over "Sonne" at 320 px).
 * - how much of its line a bubble takes, and where the sign for its menu stands on a touch screen
 *   (Bernd, 15.11.2026).
 */
const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(resolve(here, './ChatBubble.vue'), 'utf8')
const MEDIA = /@media\s*([^{]+)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g
const code = source.slice(source.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')
const styles = code.replace(MEDIA, '')

const rulesIn = (css, selector) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => m[1].split(',').some((part) => part.trim() === selector))
    .map((m) => m[2].trim().replace(/\s+/g, ' '))

/** The declarations of the rule for exactly this selector, outside any media query. */
const ruleOf = (selector) => rulesIn(styles, selector)

/** The same, inside the media queries with exactly this condition. */
const mediaRuleOf = (condition, selector) =>
  [...code.matchAll(MEDIA)]
    .filter((m) => m[1].trim() === condition)
    .flatMap((m) => rulesIn(m[2], selector))

describe('ChatBubble, what only a browser lays out', () => {
  it('keeps own messages to the right', () => {
    expect(ruleOf('.chat-bubble-mine')).toContainEqual(
      expect.stringMatching(/align-items:\s*flex-end\s*;/),
    )
  })

  it("keeps the other person's messages to the left", () => {
    expect(ruleOf('.chat-bubble-theirs')).toContainEqual(
      expect.stringMatching(/align-items:\s*flex-start\s*;/),
    )
  })

  it('keeps the name in the line over a forwarded copy whole', () => {
    expect(ruleOf('.chat-bubble-forwarded-name')).toContainEqual(
      expect.stringMatching(/display:\s*inline-block\s*;[\s\S]*max-width:\s*100%\s*;/),
    )
  })

  /** The sheet (below `sm`, where the chat windows cover a phone's screen), and with a touch screen. */
  const SHEET = '(width <= 575.98px)'
  const TOUCH_SHEET = '(width <= 575.98px) and (hover: none)'

  /**
   * Four fifths of its line; on the sheet nine tenths, less the room of the sign for the menu
   * where a pointer shows one. At 390 px a bubble beside a face in a group stood 226 px wide.
   */
  describe('the share of its line a bubble takes', () => {
    it('is four fifths', () => {
      expect(ruleOf('.chat-bubble-row')).toContainEqual(
        expect.stringMatching(/(^|;\s*)--chat-bubble-share: 80%;/),
      )
    })

    it('is nine tenths on the sheet, less the room of the sign where there is one', () => {
      expect(mediaRuleOf(SHEET, '.chat-bubble-row')).toEqual([
        '--chat-bubble-share: min(90%, calc(100% - 3rem));',
      ])
      expect(mediaRuleOf(TOUCH_SHEET, '.chat-bubble-row')).toEqual(['--chat-bubble-share: 90%;'])
    })

    // Both are read, so neither moves alone: a bubble wider than this pushes the sign out of the
    // thread, which then scrolls sideways.
    it("keeps exactly the sign's reach beside the bubble", () => {
      const kept = mediaRuleOf(SHEET, '.chat-bubble-row')
        .join(' ')
        .match(/100% - ([\d.]+rem)/)?.[1]
      expect(kept).toBeTruthy()
      expect(ruleOf('.chat-bubble-theirs .chat-bubble-more')).toEqual([`right: -${kept};`])
      expect(ruleOf('.chat-bubble-mine .chat-bubble-more')).toEqual([`left: -${kept};`])
    })

    // The bubble, the writer's name over it, a greeting's bubble, the bubble of a picture and
    // the line where no mail went out: one measure, so none of them stays behind on a phone.
    it.each([
      ['.chat-bubble', 'max-width: var(--chat-bubble-share);'],
      ['.chat-bubble-writer', 'max-width: var(--chat-bubble-share);'],
      ['.chat-bubble-not-mailed', 'max-width: var(--chat-bubble-share);'],
      ['.chat-bubble-greeting .chat-bubble', 'width: var(--chat-bubble-share);'],
      ['.chat-bubble.has-image', 'min-width: min(16.5rem, var(--chat-bubble-share));'],
    ])('%s takes it', (selector, declaration) => {
      // From the rule's start or behind a `;`: `width` is not found in `max-width`.
      expect(ruleOf(selector).map((rule) => `; ${rule}`)).toContainEqual(
        expect.stringContaining(`; ${declaration}`),
      )
    })
  })

  /**
   * On a phone the face stands over somebody else's message, in the line of the writer's name, and
   * the bubble takes the line from its start (Bernd, 16.11.2026): beside the face it began 55 px in,
   * and one's own reached further left than that. The name as high as the face, beside it.
   */
  describe('the face over the message on a phone', () => {
    it('takes away the room beside the bubble on the sheet, and keeps it at the desk', () => {
      expect(ruleOf('.chat-bubble-in-group')).toContainEqual(
        expect.stringMatching(/padding-left: calc\(var\(--chat-bubble-face, 48px\) \+ 0\.45rem\);/),
      )
      expect(mediaRuleOf(SHEET, '.chat-bubble-in-group')).toEqual(['padding-left: 0;'])
    })

    it("puts the writer's name beside the face, as high as the face", () => {
      expect(mediaRuleOf(SHEET, '.chat-bubble-in-group .chat-bubble-writer')).toEqual([
        'max-width: calc(100% - var(--chat-bubble-face) - 0.45rem); margin: 0 0 0.25rem calc(var(--chat-bubble-face) + 0.45rem); line-height: var(--chat-bubble-face);',
      ])
    })

    // Bernd, 16.11.2026: the face is 36 px, a tap finds it from 44 -- an invisible border of
    // 0.25rem, the face pulled out by as much. Its keyboard ring stays at the face.
    it('takes a tap at a face with a picture from 44 px, and stands where it stood', () => {
      expect(mediaRuleOf(SHEET, '.chat-bubble-face.app-avatar-zoomable')).toEqual([
        'top: -0.25rem; left: -0.25rem; box-sizing: content-box; border: 0.25rem solid transparent;',
      ])
      expect(mediaRuleOf(SHEET, '.chat-bubble-face.app-avatar-zoomable:focus-visible')).toEqual([
        'outline-offset: -0.125rem;',
      ])
    })

    // The border reaches 0.25rem below the face, and the name's line keeps as much below it: the
    // border of a tap meets the bubble, and covers none of it.
    it('keeps the border of a tap off the bubble under the face', () => {
      const writer = mediaRuleOf(SHEET, '.chat-bubble-in-group .chat-bubble-writer').join(' ')
      const border = mediaRuleOf(SHEET, '.chat-bubble-face.app-avatar-zoomable').join(' ')
      expect(writer).toContain('margin: 0 0 0.25rem ')
      expect(border).toContain('border: 0.25rem solid transparent;')
    })

    // The face stays where the name's line begins: at the row's top and start, at every width.
    it('keeps the face at the top of the row, at its start', () => {
      expect(ruleOf('.chat-bubble-face')).toEqual(['position: absolute; top: 0; left: 0;'])
    })
  })

  /**
   * A touch screen shows no sign beside the bubble -- a tap on the message opens its menu --, but
   * the sign stays for a screen reader and a keyboard, and what is out of sight still counts for
   * how far the thread scrolls.
   */
  describe('the sign for the menu on a touch screen', () => {
    const TOUCH = '(hover: none)'

    it("stands at the bubble's own edge while it is out of sight", () => {
      expect(
        mediaRuleOf(TOUCH, '.chat-bubble-theirs .chat-bubble-more:not(:focus-visible)'),
      ).toEqual(['right: 0;'])
      expect(mediaRuleOf(TOUCH, '.chat-bubble-mine .chat-bubble-more:not(:focus-visible)')).toEqual(
        ['left: 0;'],
      )
    })

    it('is small where a keyboard shows it on the sheet, in the tenth beside the bubble', () => {
      expect(mediaRuleOf(TOUCH_SHEET, '.chat-bubble-more:focus-visible')).toEqual([
        'width: 1.25rem; height: 1.25rem; font-size: 1rem;',
      ])
      expect(
        mediaRuleOf(TOUCH_SHEET, '.chat-bubble-theirs .chat-bubble-more:focus-visible'),
      ).toEqual(['right: -1.4rem;'])
      expect(mediaRuleOf(TOUCH_SHEET, '.chat-bubble-mine .chat-bubble-more:focus-visible')).toEqual(
        ['left: -1.4rem;'],
      )
    })
  })
})
