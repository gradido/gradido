// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatFileCard from './ChatFileCard.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

const LINK = 'https://www.swisstransfer.com/d/7f3a9c2e-5b1d-4e8a-9c3f-2d6b8a1e4f70'

describe('ChatFileCard', () => {
  let wrapper

  const mountCard = (href = LINK) => {
    wrapper = mount(ChatFileCard, {
      props: { href },
      global: { stubs: { IMdiFileDocumentOutline: true, IMdiOpenInNew: true } },
    })
    return wrapper
  }

  afterEach(() => {
    wrapper?.unmount()
  })

  // One link, the whole card, to where it says -- in a tab of its own, with no address of the
  // thread going along.
  it('is one link to the files, opening a tab of its own', () => {
    mountCard()

    const links = wrapper.findAll('a')
    expect(links).toHaveLength(1)
    expect(wrapper.element).toBe(links[0].element)
    expect(wrapper.attributes('href')).toBe(LINK)
    expect(wrapper.attributes('target')).toBe('_blank')
    expect(wrapper.attributes('rel')).toBe('noopener noreferrer')
  })

  // It names where it leads: what it is, and the address itself under it.
  it('says what it is, and where it leads', () => {
    mountCard()

    expect(wrapper.find('.chat-file-card-title').text()).toBe('chatThread.fileCard')
    expect(wrapper.find('[data-test="chat-file-card-where"]').text()).toBe(
      'swisstransfer.com/d/7f3a9c2e-5b1d-4e8a-9c3f-2d6b8a1e4f70',
    )
    // The link's name is its words: the two signs are for the eye.
    expect(wrapper.find('.chat-file-card-icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.chat-file-card-go').attributes('aria-hidden')).toBe('true')
  })

  it('names the host as a browser shows it', () => {
    mountCard('https://WWW.SwissTransfer.COM/dl/Ab3dE5fG')
    expect(wrapper.find('[data-test="chat-file-card-where"]').text()).toBe(
      'swisstransfer.com/dl/Ab3dE5fG',
    )
  })

  const style = () =>
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ChatFileCard.vue'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
  const rule = (selector) => style().match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

  /**
   * ⛔ Rules only the stylesheet holds (jsdom lays nothing out), comments stripped first so their
   * explanations cannot stand in for them:
   * - the card resets the bubble's `pre-wrap`, and has a rim and a ground of its own;
   * - the destination stays on one line and ends early, inside a part allowed to be narrower than
   *   its content -- otherwise the address would run out of the card;
   * - each text sets its own colour: the dark mode colours links green by a rule that beats the
   *   card's (`.dark-mode a:not(.btn)`);
   * - a visible focus.
   */
  it('keeps its looks in the stylesheet', () => {
    const card = rule('\\.chat-file-card')
    expect(card).toMatch(/white-space:\s*normal/)
    expect(card).toMatch(/display:\s*flex/)
    expect(card).toMatch(/border:\s*1px solid/)
    expect(card).toMatch(/background:\s*var\(--surface/)

    expect(rule('\\.chat-file-card-text')).toMatch(/min-width:\s*0/)

    const where = rule('\\.chat-file-card-where')
    expect(where).toMatch(/white-space:\s*nowrap/)
    expect(where).toMatch(/text-overflow:\s*ellipsis/)
    expect(where).toMatch(/overflow:\s*hidden/)
    expect(where).toMatch(/(?:^|\s)color:\s*var\(--bs-secondary-color/)

    expect(rule('\\.chat-file-card-title')).toMatch(/(?:^|\s)color:\s*var\(--bs-body-color/)
    expect(rule('\\.chat-file-card:focus-visible')).toMatch(/outline:\s*2px solid/)
  })

  /**
   * On the sheet (below `sm`) the card sets closer, with a smaller file sign and without the sign
   * for "opens elsewhere": measured at 320 px, its words had 88 px before and broke inside
   * "SwissTransfer", and 128 px after. The rule is the stylesheet's alone.
   */
  it('sets closer on the sheet, without the sign for "opens elsewhere"', () => {
    const sheet = style().match(/\n@media \(width <= 575\.98px\) \{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(sheet, 'no rule for the sheet').not.toBe('')
    expect(sheet).toMatch(/\.chat-file-card-go\s*\{\s*display:\s*none;?\s*\}/)
    expect(sheet).toMatch(/\.chat-file-card-icon\s*\{[^}]*\bwidth:\s*2rem/)
    expect(sheet).toMatch(/\.chat-file-card\s*\{[^}]*\bgap:\s*0\.5rem/)
  })
})
