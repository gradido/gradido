// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChatReactionChoice from './ChatReactionChoice.vue'
import { CHAT_QUICK_REACTIONS } from '@/utils/chatReactions'
import { EMOJI_ROWS } from '@/utils/emojiChoice'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

const THUMB = '👍'
const HEART = '❤️'
// One of the forty-eight that is none of the six.
const CAKE = '🍰'

describe('ChatReactionChoice', () => {
  let wrapper

  const mountChoice = (props = {}) => {
    wrapper = mount(ChatReactionChoice, {
      props,
      attachTo: document.body,
      global: { stubs: { IMdiPlus: { template: '<i data-test="plus" />' } } },
    })
    return wrapper
  }

  const quick = () => wrapper.findAll('[data-test="chat-reaction-quick"]')
  const signs = (buttons) => buttons.map((button) => button.text())
  const more = () => wrapper.find('[data-test="chat-reaction-more"]')
  const grid = () => wrapper.find('[data-test="chat-reaction-grid"]')
  const all = () => wrapper.findAll('[data-test="chat-reaction-emoji"]')
  const key = (target, name, init = {}) =>
    target.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }),
    )
  const focused = () => document.activeElement

  afterEach(() => wrapper?.unmount())

  describe('the row', () => {
    // A toolbar: that says to a screen reader that the arrows lead on from the one stop for Tab.
    it('shows the six and "mehr" behind them, as a toolbar with a name', () => {
      mountChoice()

      expect(signs(quick())).toEqual([...CHAT_QUICK_REACTIONS])
      expect(more().exists()).toBe(true)
      expect(more().attributes('aria-label')).toBe('chatThread.reactMore')
      expect(more().attributes('title')).toBe('chatThread.reactMore')
      expect(more().find('[data-test="plus"]').attributes('aria-hidden')).toBe('true')
      const row = wrapper.find('[data-test="chat-reaction-row"]')
      expect(row.attributes('role')).toBe('toolbar')
      expect(row.attributes('aria-label')).toBe('chatThread.react')
      expect(row.attributes('aria-busy')).toBeUndefined()
      // The name is the toolbar's alone: around it there is no second group to be read out.
      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-label')).toBeUndefined()
      expect(grid().exists()).toBe(false)
    })

    /**
     * ⛔ While a reaction to the message is on its way (S5 of the second reading, 11.10.2026): a
     * second press was passed over without a sign -- the thumb pressed by mistake and pressed
     * again to take it back stayed, for everybody. Now no emoji takes a press meanwhile, and
     * shows it; the buttons stay buttons, so that the keyboard keeps its place.
     */
    describe('while a reaction is on its way', () => {
      it('takes no press on an emoji, and says so to the eye and to the ear', async () => {
        mountChoice({ own: HEART, busy: true })

        for (const button of quick()) {
          expect(button.attributes('aria-disabled')).toBe('true')
          expect(button.attributes('disabled')).toBeUndefined()
          await button.trigger('click')
        }
        expect(wrapper.emitted('react')).toBeUndefined()
        expect(wrapper.classes()).toContain('is-busy')
        expect(wrapper.find('[data-test="chat-reaction-row"]').attributes('aria-busy')).toBe('true')
      })

      it('still opens all forty-eight, which take no press either', async () => {
        mountChoice({ busy: true })

        await more().trigger('click')
        await flushPromises()

        expect(grid().attributes('aria-busy')).toBe('true')
        expect(all()).toHaveLength(48)
        await all()[7].trigger('click')
        expect(all()[7].attributes('aria-disabled')).toBe('true')
        expect(wrapper.emitted('react')).toBeUndefined()
      })

      it('takes a press again once the answer is in', async () => {
        mountChoice({ busy: true })
        await quick()[0].trigger('click')
        expect(wrapper.emitted('react')).toBeUndefined()

        await wrapper.setProps({ busy: false, own: THUMB })

        expect(quick()[0].attributes('aria-disabled')).toBeUndefined()
        expect(wrapper.classes()).not.toContain('is-busy')
        await quick()[0].trigger('click')
        expect(wrapper.emitted('react')).toEqual([[THUMB]])
      })
    })

    // Kept by their place: the last of the six gives way to an own reaction from behind "mehr",
    // and a button that is replaced loses the keyboard that stands on it.
    it('keeps the button the keyboard stands on when its emoji changes', async () => {
      mountChoice()
      const last = quick()[5]
      last.element.focus()
      expect(focused()).toBe(last.element)

      await wrapper.setProps({ own: CAKE })

      expect(quick()[5].element).toBe(last.element)
      expect(quick()[5].text()).toBe(CAKE)
      expect(focused()).toBe(last.element)
    })

    /**
     * ⛔ For the ear a button is its emoji -- which says its own name -- and whether it is
     * pressed. No sentence as its name: with the emoji's name in it, "Mit Rotes Herz reagieren"
     * is heard in the wrong case in every language that has cases, seven times along the row;
     * and a name that changes with the state says "zurücknehmen, pressed". The sentence is for
     * the pointer that rests on the button.
     */
    it('names every button by its emoji alone, and says to the pointer what a press does', () => {
      mountChoice()

      for (const button of quick()) {
        expect(button.attributes('aria-label')).toBeUndefined()
        expect(button.element.textContent.trim()).toBe(button.text())
        expect(button.attributes('title')).toBe(
          `chatThread.reactWith ${JSON.stringify({ emoji: button.text() })}`,
        )
        expect(button.attributes('aria-pressed')).toBe('false')
        expect(button.attributes('type')).toBe('button')
      }
    })

    it('shows the member’s own reaction pressed, and says to the pointer that a press takes it back', () => {
      mountChoice({ own: HEART })

      const own = quick().find((button) => button.text() === HEART)
      expect(own.attributes('aria-pressed')).toBe('true')
      expect(own.classes()).toContain('is-own')
      // Its name is the emoji, pressed or not: what changes is the state.
      expect(own.attributes('aria-label')).toBeUndefined()
      expect(own.attributes('title')).toBe(
        `chatThread.reactTakeBack ${JSON.stringify({ emoji: HEART })}`,
      )
      // Only that one.
      expect(quick().filter((button) => button.attributes('aria-pressed') === 'true')).toHaveLength(
        1,
      )
      expect(quick().filter((button) => button.classes().includes('is-own'))).toHaveLength(1)
    })

    // ⛔ A reaction chosen behind "mehr" is none of the six: it stands in the place of the last
    // one, so that what is pressed is in sight and a press takes it back.
    it('puts an own reaction that is none of the six in the place of the last one', () => {
      mountChoice({ own: CAKE })

      expect(signs(quick())).toEqual([...CHAT_QUICK_REACTIONS.slice(0, 5), CAKE])
      expect(quick()[5].attributes('aria-pressed')).toBe('true')
      expect(quick()).toHaveLength(6)
    })

    it('says which emoji was pressed, and nothing more', async () => {
      mountChoice({ own: HEART })

      await quick()[0].trigger('click')
      await quick()[1].trigger('click')

      // The own one too: whether that takes it back, whoever holds the message decides.
      expect(wrapper.emitted('react')).toEqual([[THUMB], [HEART]])
      expect(wrapper.emitted('all')).toBeUndefined()
    })

    // One stop for Tab: seven would stand between the keyboard and the menu's entries.
    it('has one stop for Tab, where the keyboard stood last', async () => {
      mountChoice()
      const stops = () => [...quick(), more()].map((button) => button.attributes('tabindex'))

      expect(stops()).toEqual(['0', '-1', '-1', '-1', '-1', '-1', '-1'])
      await quick()[2].trigger('focus')
      expect(stops()).toEqual(['-1', '-1', '0', '-1', '-1', '-1', '-1'])
      await more().trigger('focus')
      expect(stops()).toEqual(['-1', '-1', '-1', '-1', '-1', '-1', '0'])
    })

    // A choice of one: the keyboard comes in on what is chosen, as it does in a group of radios.
    it('has that stop on the member’s own reaction to begin with, wherever it stands in the row', () => {
      const stops = () => [...quick(), more()].map((button) => button.attributes('tabindex'))

      mountChoice({ own: HEART })
      expect(stops()).toEqual(['-1', '0', '-1', '-1', '-1', '-1', '-1'])
      wrapper.unmount()

      // One from behind "mehr" stands in the last place of the six.
      mountChoice({ own: CAKE })
      expect(stops()).toEqual(['-1', '-1', '-1', '-1', '-1', '0', '-1'])
    })

    it('moves along the row with the arrows, to its ends with Home and End, and stops there', async () => {
      mountChoice()
      quick()[0].element.focus()

      key(quick()[0], 'ArrowRight')
      expect(focused()).toBe(quick()[1].element)
      key(quick()[1], 'End')
      expect(focused()).toBe(more().element)
      key(more(), 'ArrowRight')
      expect(focused()).toBe(more().element)
      key(more(), 'ArrowLeft')
      expect(focused()).toBe(quick()[5].element)
      key(quick()[5], 'Home')
      expect(focused()).toBe(quick()[0].element)
      key(quick()[0], 'ArrowLeft')
      expect(focused()).toBe(quick()[0].element)
    })

    // An arrow in a window would move the thread behind the menu.
    it('keeps the arrows from the page, and leaves every other key and a modifier alone', () => {
      mountChoice()
      quick()[0].element.focus()
      const taken = (name, init) => {
        const event = new KeyboardEvent('keydown', {
          key: name,
          bubbles: true,
          cancelable: true,
          ...init,
        })
        quick()[0].element.dispatchEvent(event)
        return event.defaultPrevented
      }

      expect(taken('ArrowRight')).toBe(true)
      expect(taken('ArrowUp')).toBe(true)
      expect(taken('ArrowDown')).toBe(true)
      expect(taken('Enter')).toBe(false)
      expect(taken('Tab')).toBe(false)
      expect(taken('Escape')).toBe(false)
      expect(taken('ArrowLeft', { altKey: true })).toBe(false)
    })

    it('stays in the row for an arrow up or down', () => {
      mountChoice()
      quick()[3].element.focus()

      key(quick()[3], 'ArrowDown')
      key(quick()[3], 'ArrowUp')

      expect(focused()).toBe(quick()[3].element)
    })
  })

  describe('"mehr"', () => {
    it('shows all forty-eight in the place of the row, as a grid, and says so', async () => {
      mountChoice()

      await more().trigger('click')
      await flushPromises()

      expect(wrapper.emitted('all')).toEqual([[true]])
      expect(quick()).toHaveLength(0)
      expect(more().exists()).toBe(false)
      expect(grid().attributes('role')).toBe('grid')
      expect(grid().attributes('aria-label')).toBe('chatThread.react')
      expect(grid().findAll('[role="row"]')).toHaveLength(EMOJI_ROWS.length)
      expect(grid().findAll('[role="gridcell"]')).toHaveLength(48)
      expect(signs(all())).toEqual(EMOJI_ROWS.flat())
    })

    it('puts the keyboard on the first emoji -- the button that was pressed is gone', async () => {
      mountChoice()

      await more().trigger('click')
      await flushPromises()

      expect(focused()).toBe(all()[0].element)
      expect(all().filter((button) => button.attributes('tabindex') === '0')).toHaveLength(1)
    })

    it('puts the keyboard on the member’s own reaction where it is among them, shown pressed', async () => {
      mountChoice({ own: CAKE })

      await more().trigger('click')
      await flushPromises()

      const own = all().find((button) => button.text() === CAKE)
      expect(focused()).toBe(own.element)
      expect(own.attributes('aria-pressed')).toBe('true')
      expect(own.attributes('tabindex')).toBe('0')
      expect(own.attributes('aria-label')).toBeUndefined()
      expect(own.attributes('title')).toBe(
        `chatThread.reactTakeBack ${JSON.stringify({ emoji: CAKE })}`,
      )
      expect(all().filter((button) => button.attributes('aria-pressed') === 'true')).toHaveLength(1)
    })

    it('says which of the forty-eight was pressed', async () => {
      mountChoice()
      await more().trigger('click')
      await flushPromises()

      await all()
        .find((button) => button.text() === CAKE)
        .trigger('click')

      expect(wrapper.emitted('react')).toEqual([[CAKE]])
    })

    it('moves through the grid with the arrows, and stops at its edges', async () => {
      mountChoice()
      await more().trigger('click')
      await flushPromises()
      const at = (row, column) =>
        wrapper.find(`[data-row="${row}"][data-column="${column}"]`).element

      key(all()[0], 'ArrowRight')
      expect(focused()).toBe(at(0, 1))
      key(all()[1], 'ArrowDown')
      expect(focused()).toBe(at(1, 1))
      key(wrapper.find('[data-row="1"][data-column="1"]'), 'End')
      expect(focused()).toBe(at(1, 7))
      key(wrapper.find('[data-row="1"][data-column="7"]'), 'ArrowRight')
      expect(focused()).toBe(at(1, 7))
      key(wrapper.find('[data-row="1"][data-column="7"]'), 'Home')
      expect(focused()).toBe(at(1, 0))
      key(wrapper.find('[data-row="1"][data-column="0"]'), 'ArrowUp')
      key(wrapper.find('[data-row="0"][data-column="0"]'), 'ArrowUp')
      expect(focused()).toBe(at(0, 0))
    })
  })

  /**
   * What only the stylesheet says, read from the source with the comments taken out (jsdom lays
   * nothing out).
   */
  describe('its stylesheet', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatReactionChoice.vue'),
      'utf8',
    )
    const style = source.slice(source.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) =>
      style.match(
        new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{([^}]*)\\}`),
      )?.[2] ?? ''

    // 2.75rem is 44 px: a finger's size for the six that are a tap away.
    it('makes the six and "mehr" a finger high, each an equal share of the row', () => {
      const emoji = rule('.chat-reaction-choice-emoji,\n.chat-reaction-choice-more')
      expect(emoji).toMatch(/height:\s*2\.75rem/)
      expect(emoji).toMatch(/flex:\s*1 1 0/)
      expect(emoji).toMatch(/min-width:\s*0/)
    })

    it('draws the emoji in the device’s own coloured font', () => {
      expect(rule('.chat-reaction-choice-emoji,\n.chat-reaction-choice-more')).toMatch(
        /font-family:\s*'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'/,
      )
    })

    // Eight in a row, and the columns give way where the menu is narrower than they are.
    it('lays the forty-eight out eight in a row, in columns that give way', () => {
      expect(rule('.chat-reaction-choice-line')).toContain(
        `repeat(${EMOJI_ROWS[0].length}, minmax(0, 2.25rem))`,
      )
    })

    // Under a finger they stand edge to edge, and a miss sets a reaction everybody sees.
    it('makes the forty-eight larger where there is no pointer that hovers', () => {
      const touch = style.match(/@media \(hover: none\) \{([\s\S]*?)\n\}/)?.[1] ?? ''
      expect(touch).toContain(`repeat(${EMOJI_ROWS[0].length}, minmax(0, 2.75rem))`)
    })

    /**
     * ⛔ One's own reaction is told by its rim alone, and the keyboard's ring is drawn where the
     * rim is (both 2 px, inside): with the keyboard on it -- which is where it comes in -- the
     * ring covered the rim. The rim moves in by the ring's width.
     */
    it('keeps the rim of one’s own reaction in sight inside the keyboard’s ring', () => {
      const ring = rule(
        '.chat-reaction-choice-emoji:focus-visible,\n.chat-reaction-choice-more:focus-visible',
      )
      expect(ring).toMatch(/outline:\s*2px solid/)
      expect(ring).toMatch(/outline-offset:\s*-2px/)
      expect(rule('.chat-reaction-choice-emoji.is-own')).toMatch(/box-shadow:\s*inset 0 0 0 2px/)
      expect(rule('.chat-reaction-choice-emoji.is-own:focus-visible')).toMatch(
        /box-shadow:\s*inset 0 0 0 4px/,
      )
    })

    // The gold of the menu's signs: the plain gold came to 2.2 : 1 on the menu's grey.
    it('draws that rim in the gold that can be told from the menu’s grey', () => {
      expect(rule('.chat-reaction-choice-emoji.is-own')).toContain('var(--menu-icon, #a8732a)')
      expect(rule('.chat-reaction-choice-emoji.is-own:focus-visible')).toContain(
        'var(--menu-icon, #a8732a)',
      )
    })
  })
})
