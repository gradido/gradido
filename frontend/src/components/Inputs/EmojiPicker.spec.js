// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EmojiPicker from './EmojiPicker.vue'
import { EMOJI_ROWS, emojiKeysOf } from '@/utils/emojiChoice'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

// The keys of the device: a Mac unless a test says otherwise. The rule itself has its own spec.
vi.mock('@/utils/emojiChoice', async (importOriginal) => ({
  ...(await importOriginal()),
  emojiKeysOf: vi.fn(() => 'mac'),
}))

const FIELD_ID = 'the-field'
/** A click of the mouse, as the browser sends it; a click made by a key carries `detail` 0. */
const BY_MOUSE = { detail: 1 }
const BY_KEY = { detail: 0 }

describe('EmojiPicker', () => {
  let wrapper
  let field

  /**
   * The smiley beside a text field, both in the page -- the picker finds its field by its id, and
   * the focus only moves between elements that are in a document.
   */
  const mountPicker = (props = {}, { value = '', caret = value.length } = {}) => {
    field = document.createElement('textarea')
    field.id = FIELD_ID
    document.body.appendChild(field)
    field.value = value
    field.setSelectionRange(caret, caret)
    wrapper = mount(EmojiPicker, {
      props: { fieldId: FIELD_ID, ...props },
      attachTo: document.body,
      global: { stubs: { IMdiEmoticonHappyOutline: true } },
    })
    return wrapper
  }

  const toggle = () => wrapper.find('[data-test="emoji-picker-toggle"]')
  const panel = () => wrapper.find('[data-test="emoji-picker-panel"]')
  const emojis = () => wrapper.findAll('[data-test="emoji-picker-emoji"]')
  const emoji = (sign) => emojis().find((button) => button.element.textContent.trim() === sign)
  /**
   * A click as the browser sends it. Not through the test utils' `trigger`: `detail` is what tells
   * a click of the mouse from one made by a key, and they cannot set it.
   */
  const click = async (target, { detail }) => {
    target.element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, detail }),
    )
    await wrapper.vm.$nextTick()
  }
  const open = async (press = BY_MOUSE) => {
    await click(toggle(), press)
    await flushPromises()
  }
  /** A key pressed somewhere in the page: it goes down to the body and up again to the window. */
  const key = (name, init = {}) =>
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }),
    )

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
    vi.mocked(emojiKeysOf).mockReturnValue('mac')
    vi.restoreAllMocks()
  })

  describe('the smiley', () => {
    it('is a button with a name, and says that its choice is shut', () => {
      mountPicker()

      expect(toggle().element.tagName).toBe('BUTTON')
      expect(toggle().attributes('type')).toBe('button')
      expect(toggle().attributes('aria-label')).toBe('emoji.insert')
      expect(toggle().attributes('title')).toBe('emoji.insert')
      expect(toggle().attributes('aria-expanded')).toBe('false')
      // Nothing to point to while the choice is not in the page.
      expect(toggle().attributes('aria-controls')).toBeUndefined()
      expect(panel().exists()).toBe(false)
    })

    it('opens the choice, says so, and names it', async () => {
      mountPicker()

      await open()

      expect(panel().exists()).toBe(true)
      expect(toggle().attributes('aria-expanded')).toBe('true')
      expect(toggle().attributes('aria-controls')).toBe(panel().attributes('id'))
      expect(panel().attributes('id')).toBeTruthy()
      expect(toggle().classes()).toContain('is-open')
    })

    it('closes it when pressed once more', async () => {
      mountPicker()
      await open()

      await click(toggle(), BY_MOUSE)

      expect(panel().exists()).toBe(false)
      expect(toggle().attributes('aria-expanded')).toBe('false')
    })

    // The caret shows where the emoji will go: a click on the smiley must not take it away.
    it('takes no focus from the field when it is clicked', async () => {
      mountPicker()

      const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
      toggle().element.dispatchEvent(press)

      expect(press.defaultPrevented).toBe(true)
    })

    // The caret shows where the emoji will go, and the keys the line under the emoji names
    // need a field to write into.
    it('puts the focus into the field when opened by a click', async () => {
      mountPicker({}, { value: 'Hallo' })
      expect(document.activeElement).toBe(document.body)

      await open(BY_MOUSE)

      expect(document.activeElement).toBe(field)
      expect(panel().exists()).toBe(true)
    })

    it('takes it there from wherever it stood', async () => {
      mountPicker({}, { value: 'Hallo' })
      const other = document.createElement('button')
      document.body.appendChild(other)
      other.focus()

      await open(BY_MOUSE)

      expect(document.activeElement).toBe(field)
      // The field is the picker's own: the choice does not close behind a focus that goes there.
      expect(panel().exists()).toBe(true)
    })

    it('leaves the caret where it stands in a field that has the focus', async () => {
      mountPicker({}, { value: 'Hallo', caret: 2 })
      field.focus()
      const again = vi.spyOn(field, 'focus')

      await open(BY_MOUSE)

      expect(document.activeElement).toBe(field)
      expect(again).not.toHaveBeenCalled()
      expect(field.selectionStart).toBe(2)
    })

    it('does not move the page to bring the field into sight', async () => {
      mountPicker()
      const focused = vi.spyOn(field, 'focus')

      await open(BY_MOUSE)

      expect(focused).toHaveBeenCalledWith({ preventScroll: true })
    })

    it('takes the focus into the choice when opened by the keyboard', async () => {
      mountPicker()
      toggle().element.focus()

      await open(BY_KEY)

      expect(document.activeElement).toBe(emojis()[0].element)
    })
  })

  describe('the choice', () => {
    it('shows the wallet’s forty-eight emoji, row by row', async () => {
      mountPicker()
      await open()

      expect(emojis()).toHaveLength(48)
      expect(emojis().map((button) => button.element.textContent.trim())).toEqual(EMOJI_ROWS.flat())
    })

    // The sign is the emoji's name for a screen reader: nothing may stand beside it.
    it('writes each emoji into its button and nothing else', async () => {
      mountPicker()
      await open()

      for (const button of emojis()) {
        expect(EMOJI_ROWS.flat()).toContain(button.element.textContent.trim())
        expect(button.attributes('aria-label')).toBeUndefined()
        expect(button.attributes('type')).toBe('button')
      }
    })

    it('is a grid for a screen reader: named, with rows and cells', async () => {
      mountPicker()
      await open()

      const grid = wrapper.find('[data-test="emoji-picker-grid"]')
      expect(grid.attributes('role')).toBe('grid')
      expect(grid.attributes('aria-label')).toBe('emoji.choice')
      const rows = grid.findAll('[role="row"]')
      expect(rows).toHaveLength(6)
      for (const row of rows) {
        const cells = row.findAll('[role="gridcell"]')
        expect(cells).toHaveLength(8)
        for (const cell of cells) expect(cell.findAll('button')).toHaveLength(1)
      }
    })

    it('is one stop for Tab: the emoji the keyboard stands on', async () => {
      mountPicker()
      await open()

      const stops = emojis().filter((button) => button.attributes('tabindex') === '0')
      expect(stops).toHaveLength(1)
      expect(stops[0].element).toBe(emojis()[0].element)
      expect(emojis().filter((button) => button.attributes('tabindex') === '-1')).toHaveLength(47)
    })

    // A press on a part that takes no focus would hand the focus to the window around it.
    it('keeps the focus where it is under every press inside it', async () => {
      mountPicker()
      await open()

      const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
      wrapper.find('[data-test="emoji-picker-more"]').element.dispatchEvent(press)

      expect(press.defaultPrevented).toBe(true)
    })
  })

  describe('a press on an emoji', () => {
    it('puts it into the field where the caret stands', async () => {
      mountPicker({}, { value: 'Danke Dir', caret: 5 })
      await open()

      await click(emoji('🙏'), BY_MOUSE)

      expect(field.value).toBe('Danke🙏 Dir')
    })

    it('lets the field say that it was typed in', async () => {
      mountPicker({}, { value: 'Hallo ' })
      const heard = vi.fn()
      field.addEventListener('input', heard)
      await open()

      await click(emoji('👋'), BY_MOUSE)

      expect(heard).toHaveBeenCalledTimes(1)
    })

    it('leaves the choice open for the next one', async () => {
      mountPicker()
      await open()

      await click(emoji('🙏'), BY_MOUSE)
      await click(emoji('🌱'), BY_MOUSE)
      await click(emoji('🌱'), BY_MOUSE)

      expect(panel().exists()).toBe(true)
      expect(field.value).toBe('🙏🌱🌱')
    })

    it('leaves the focus in the field after a click', async () => {
      mountPicker()
      await open()

      await click(emoji('🙂'), BY_MOUSE)

      expect(document.activeElement).toBe(field)
      // The field is the picker's own: the choice does not close behind a focus that goes there.
      expect(panel().exists()).toBe(true)
    })

    it('brings the focus back to the emoji when it was chosen by the keyboard', async () => {
      mountPicker()
      toggle().element.focus()
      await open(BY_KEY)
      const pressed = emoji('😊')
      pressed.element.focus()

      await click(pressed, BY_KEY)
      await flushPromises()

      expect(field.value).toBe('😊')
      expect(document.activeElement).toBe(pressed.element)
      expect(panel().exists()).toBe(true)
    })

    it('says for the ear what went in', async () => {
      mountPicker()
      await open()
      const status = () => wrapper.find('[data-test="emoji-picker-status"]')
      expect(status().attributes('role')).toBe('status')
      expect(status().text()).toBe('')

      await click(emoji('🙏'), BY_MOUSE)
      await flushPromises()

      expect(status().text()).toBe('emoji.inserted {"emoji":"🙏"}')
    })

    // The same words twice would be said once: the line is emptied before it is written again,
    // and so it is written anew -- which is what a screen reader waits for.
    it('says the same emoji again when it is chosen again', async () => {
      mountPicker()
      await open()
      const status = () => wrapper.find('[data-test="emoji-picker-status"]')
      await click(emoji('🙏'), BY_MOUSE)
      await flushPromises()
      const written = vi.fn()
      const watcher = new MutationObserver(written)
      watcher.observe(status().element, { childList: true, characterData: true, subtree: true })

      await click(emoji('🙏'), BY_MOUSE)
      await flushPromises()
      // The observer reports in a task of its own.
      await new Promise((resolve) => setTimeout(resolve))
      watcher.disconnect()

      expect(written).toHaveBeenCalled()
      expect(status().text()).toBe('emoji.inserted {"emoji":"🙏"}')
    })

    // What was said of the last emoji is not said again when the choice opens the next time.
    it('begins without a word when it opens again', async () => {
      mountPicker()
      await open()
      await click(emoji('🙏'), BY_MOUSE)
      await flushPromises()
      await click(toggle(), BY_MOUSE)

      await open()

      expect(wrapper.find('[data-test="emoji-picker-status"]').text()).toBe('')
    })

    // The sentence is written a moment after the press. A choice shut in that moment has no
    // line to write it into -- and must not keep it for the next time it opens.
    it('says nothing of an emoji whose choice was shut in the same breath', async () => {
      mountPicker()
      await open()

      emoji('🙏').element.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
      )
      wrapper.vm.close()
      await flushPromises()
      expect(field.value).toBe('🙏')
      await open()

      expect(wrapper.find('[data-test="emoji-picker-status"]').text()).toBe('')
    })

    it('says nothing and moves nothing where the field is full', async () => {
      mountPicker({}, { value: '123456789' })
      field.maxLength = 10
      await open()

      await click(emoji('🙏'), BY_MOUSE)
      await flushPromises()

      expect(field.value).toBe('123456789')
      expect(wrapper.find('[data-test="emoji-picker-status"]').text()).toBe('')
      expect(panel().exists()).toBe(true)
    })

    it('does nothing where its field is not in the page', async () => {
      mountPicker({ fieldId: 'no-such-field' })
      await open()

      await click(emoji('🙂'), BY_MOUSE)
      await flushPromises()

      expect(field.value).toBe('')
      expect(panel().exists()).toBe(true)
    })
  })

  describe('the arrows in the choice', () => {
    const standOn = async (sign) => {
      emoji(sign).element.focus()
      await wrapper.vm.$nextTick()
    }
    const arrow = async (name, init = {}) => {
      const press = new KeyboardEvent('keydown', {
        key: name,
        bubbles: true,
        cancelable: true,
        ...init,
      })
      document.activeElement.dispatchEvent(press)
      await wrapper.vm.$nextTick()
      return press
    }
    const stoodOn = () => document.activeElement.textContent.trim()

    it('move to the neighbour: right, left, down, up', async () => {
      mountPicker()
      await open(BY_KEY)
      expect(stoodOn()).toBe(EMOJI_ROWS[0][0])

      await arrow('ArrowRight')
      expect(stoodOn()).toBe(EMOJI_ROWS[0][1])
      await arrow('ArrowDown')
      expect(stoodOn()).toBe(EMOJI_ROWS[1][1])
      await arrow('ArrowLeft')
      expect(stoodOn()).toBe(EMOJI_ROWS[1][0])
      await arrow('ArrowUp')
      expect(stoodOn()).toBe(EMOJI_ROWS[0][0])
    })

    it('take the one stop for Tab along', async () => {
      mountPicker()
      await open(BY_KEY)

      await arrow('ArrowRight')
      await arrow('ArrowDown')

      const stops = emojis().filter((button) => button.attributes('tabindex') === '0')
      expect(stops).toHaveLength(1)
      expect(stops[0].element.textContent.trim()).toBe(EMOJI_ROWS[1][1])
    })

    it('stop at the edges of the grid', async () => {
      mountPicker()
      await open(BY_KEY)

      await arrow('ArrowLeft')
      expect(stoodOn()).toBe(EMOJI_ROWS[0][0])
      await arrow('ArrowUp')
      expect(stoodOn()).toBe(EMOJI_ROWS[0][0])

      await standOn(EMOJI_ROWS[5][7])
      await arrow('ArrowRight')
      expect(stoodOn()).toBe(EMOJI_ROWS[5][7])
      await arrow('ArrowDown')
      expect(stoodOn()).toBe(EMOJI_ROWS[5][7])
    })

    it('Home and End go to the ends of the row', async () => {
      mountPicker()
      await open(BY_KEY)
      await standOn(EMOJI_ROWS[2][3])

      await arrow('End')
      expect(stoodOn()).toBe(EMOJI_ROWS[2][7])
      await arrow('Home')
      expect(stoodOn()).toBe(EMOJI_ROWS[2][0])
    })

    // An arrow in a window would move what is behind the choice -- also one at the grid's edge.
    it('are kept from moving the page', async () => {
      mountPicker()
      await open(BY_KEY)

      expect((await arrow('ArrowDown')).defaultPrevented).toBe(true)
      expect((await arrow('ArrowLeft')).defaultPrevented).toBe(true)
    })

    it('are the browser’s own with a modifier, and every other key is left alone', async () => {
      mountPicker()
      await open(BY_KEY)

      expect((await arrow('ArrowRight', { metaKey: true })).defaultPrevented).toBe(false)
      expect((await arrow('ArrowRight', { ctrlKey: true })).defaultPrevented).toBe(false)
      expect((await arrow('ArrowRight', { altKey: true })).defaultPrevented).toBe(false)
      expect((await arrow('a')).defaultPrevented).toBe(false)
      expect(stoodOn()).toBe(EMOJI_ROWS[0][0])
    })

    it('find the emoji the keyboard stood on last when the choice opens again', async () => {
      mountPicker()
      await open(BY_KEY)
      await arrow('ArrowRight')
      await arrow('ArrowRight')
      await click(toggle(), BY_KEY)
      expect(panel().exists()).toBe(false)

      await open(BY_KEY)

      expect(stoodOn()).toBe(EMOJI_ROWS[0][2])
    })
  })

  describe('closing', () => {
    it('Esc closes the choice and goes no further', async () => {
      mountPicker()
      await open()
      const reached = vi.fn()
      document.body.addEventListener('keydown', reached)
      field.focus()

      const press = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      field.dispatchEvent(press)
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
      // Neither the field's own Esc nor the window's hears of it.
      expect(reached).not.toHaveBeenCalled()
      expect(press.defaultPrevented).toBe(true)
      document.body.removeEventListener('keydown', reached)
    })

    it('Esc takes the focus from the choice into the field', async () => {
      mountPicker()
      toggle().element.focus()
      await open(BY_KEY)
      expect(panel().element.contains(document.activeElement)).toBe(true)

      key('Escape')
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
      expect(document.activeElement).toBe(field)
    })

    it('Esc leaves the focus where it is when it stood on the smiley', async () => {
      mountPicker()
      await open(BY_MOUSE)
      toggle().element.focus()

      key('Escape')
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
      expect(document.activeElement).toBe(toggle().element)
    })

    // A menu that closed under the focus leaves it on nothing; a window's own Esc and the place
    // Tab goes on from would be gone with it.
    it('Esc brings the focus into the field where it stood on nothing', async () => {
      mountPicker()
      await open(BY_MOUSE)
      field.blur()
      expect(document.activeElement).toBe(document.body)
      expect(panel().exists()).toBe(true)

      key('Escape')
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
      expect(document.activeElement).toBe(field)
    })

    // The emoji the keyboard stood on goes with the choice, however the choice is shut.
    it('a press elsewhere takes the focus from an emoji into the field', async () => {
      mountPicker()
      const elsewhere = document.createElement('p')
      document.body.appendChild(elsewhere)
      toggle().element.focus()
      await open(BY_KEY)
      expect(panel().element.contains(document.activeElement)).toBe(true)

      elsewhere.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
      expect(document.activeElement).toBe(field)
    })

    it('the smiley pressed again takes the focus from an emoji into the field', async () => {
      mountPicker()
      toggle().element.focus()
      await open(BY_KEY)

      await click(toggle(), BY_MOUSE)

      expect(panel().exists()).toBe(false)
      expect(document.activeElement).toBe(field)
    })

    it('a press elsewhere leaves a focus that is not in the choice alone', async () => {
      mountPicker()
      const elsewhere = document.createElement('p')
      document.body.appendChild(elsewhere)
      await open(BY_MOUSE)
      toggle().element.focus()

      elsewhere.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
      expect(document.activeElement).toBe(toggle().element)
    })

    // Only Esc looks after a focus that stands on nothing: a press elsewhere puts the focus where
    // the press is, and the field is not to take it from there.
    it('a press elsewhere leaves a focus that stands on nothing alone', async () => {
      mountPicker()
      const elsewhere = document.createElement('p')
      document.body.appendChild(elsewhere)
      await open(BY_MOUSE)
      field.blur()
      const focused = vi.spyOn(field, 'focus')

      elsewhere.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
      expect(focused).not.toHaveBeenCalled()
      expect(document.activeElement).toBe(document.body)
    })

    // Caught on the way down: a part of the page that keeps its presses to itself shuts it too.
    it('a press on something that lets no press through closes it', async () => {
      mountPicker()
      const elsewhere = document.createElement('p')
      elsewhere.addEventListener('pointerdown', (event) => event.stopPropagation())
      document.body.appendChild(elsewhere)
      await open()

      elsewhere.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
    })

    it('can be shut by whoever holds it', async () => {
      mountPicker()
      await open()

      wrapper.vm.close()
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
      expect(toggle().attributes('aria-expanded')).toBe('false')
    })

    it('every other key leaves it open and goes on', async () => {
      mountPicker()
      await open()
      const reached = vi.fn()
      window.addEventListener('keydown', reached)

      key('Enter')
      key('a')
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(true)
      expect(reached).toHaveBeenCalledTimes(2)
      window.removeEventListener('keydown', reached)
    })

    it('Esc goes on as always while the choice is shut', async () => {
      mountPicker()
      await open()
      await click(toggle(), BY_MOUSE)
      const reached = vi.fn()
      window.addEventListener('keydown', reached)

      key('Escape')

      expect(reached).toHaveBeenCalledTimes(1)
      window.removeEventListener('keydown', reached)
    })

    it('a press anywhere else closes it', async () => {
      mountPicker()
      const elsewhere = document.createElement('p')
      document.body.appendChild(elsewhere)
      await open()

      elsewhere.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
    })

    it('a press in the field leaves it open: the caret is put where the next emoji goes', async () => {
      mountPicker({}, { value: 'eins zwei' })
      await open()

      field.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(true)
    })

    it('a press on the smiley or in the choice does not close it by itself', async () => {
      mountPicker()
      await open()

      toggle().element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      emojis()[3].element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(true)
    })

    it('closes behind a focus that goes elsewhere', async () => {
      mountPicker()
      const other = document.createElement('button')
      document.body.appendChild(other)
      await open()

      other.focus()
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(false)
    })

    it('stays open while the focus is in the field, on the smiley or on an emoji', async () => {
      mountPicker()
      await open()

      field.focus()
      toggle().element.focus()
      emojis()[5].element.focus()
      await wrapper.vm.$nextTick()

      expect(panel().exists()).toBe(true)
    })

    it('listens to the page and the window only while it is open', async () => {
      const add = vi.spyOn(document, 'addEventListener')
      const remove = vi.spyOn(document, 'removeEventListener')
      const addWindow = vi.spyOn(window, 'addEventListener')
      const removeWindow = vi.spyOn(window, 'removeEventListener')
      mountPicker()
      const kinds = (spy) => spy.mock.calls.map(([kind]) => kind).sort()
      expect(kinds(add)).toEqual([])
      expect(kinds(addWindow)).toEqual([])

      await open()
      expect(kinds(add)).toEqual(['focusin', 'keydown', 'pointerdown', 'scroll'])
      expect(kinds(addWindow)).toEqual(['resize'])

      await click(toggle(), BY_MOUSE)
      expect(kinds(remove)).toEqual(['focusin', 'keydown', 'pointerdown', 'scroll'])
      expect(kinds(removeWindow)).toEqual(['resize'])
    })

    it('lets go of the page and the window when it is taken out while open', async () => {
      mountPicker()
      await open()
      const remove = vi.spyOn(document, 'removeEventListener')
      const removeWindow = vi.spyOn(window, 'removeEventListener')

      wrapper.unmount()

      expect(remove.mock.calls.map(([kind]) => kind).sort()).toEqual([
        'focusin',
        'keydown',
        'pointerdown',
        'scroll',
      ])
      expect(removeWindow.mock.calls.map(([kind]) => kind)).toEqual(['resize'])
    })
  })

  describe('the line under the emoji', () => {
    it('names the Mac’s keys on a Mac', async () => {
      mountPicker()
      await open()

      expect(wrapper.find('[data-test="emoji-picker-more"]').text()).toBe('emoji.moreOnMac')
    })

    it('names Windows’ keys on Windows', async () => {
      vi.mocked(emojiKeysOf).mockReturnValue('windows')
      mountPicker()
      await open()

      expect(wrapper.find('[data-test="emoji-picker-more"]').text()).toBe('emoji.moreOnWindows')
    })

    it('is not there where the wallet does not know the keys', async () => {
      vi.mocked(emojiKeysOf).mockReturnValue(null)
      mountPicker()
      await open()

      expect(wrapper.find('[data-test="emoji-picker-more"]').exists()).toBe(false)
      expect(emojis()).toHaveLength(48)
    })
  })

  describe('where the choice hangs', () => {
    /** The size of the choice in these tests; the gap to what it hangs from, and to the screen. */
    const CARD = { width: 300, height: 260 }
    const GAP = 6
    const EDGE = 8
    let laidOut

    /**
     * jsdom lays nothing out. Here the page is as a test says: what the smiley is put into (the
     * bar), where it is, how large the screen is.
     */
    const layOut = ({ bar, screen = { width: 1280, height: 900 } }) => {
      laidOut = { bar, screen }
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
        if (this.classList.contains('emoji-picker-panel')) return { ...CARD, top: 0, left: 0 }
        if (this.classList.contains('the-bar')) {
          const { top, right, height = 76, width = 450 } = laidOut.bar
          return { top, right, bottom: top + height, left: right - width, width, height }
        }
        return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }
      })
      vi.spyOn(window, 'innerHeight', 'get').mockImplementation(() => laidOut.screen.height)
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockImplementation(
        () => laidOut.screen.width,
      )
    }
    const mountInBar = (props = {}) => {
      const bar = document.createElement('div')
      bar.className = 'the-bar'
      document.body.appendChild(bar)
      field = document.createElement('textarea')
      field.id = FIELD_ID
      bar.appendChild(field)
      // The nearest positioned ancestor, which jsdom does not work out.
      vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function () {
        return this.classList.contains('emoji-picker') ? bar : null
      })
      wrapper = mount(EmojiPicker, {
        props: { fieldId: FIELD_ID, ...props },
        attachTo: bar,
        global: { stubs: { IMdiEmoticonHappyOutline: true } },
      })
    }
    const spot = () => ({
      left: parseFloat(panel().element.style.left),
      top: parseFloat(panel().element.style.top),
    })

    it('over the bar, at its right end, where there is room', async () => {
      mountInBar()
      layOut({ bar: { top: 660, right: 866 } })

      await open()

      expect(spot()).toEqual({ left: 866 - CARD.width, top: 660 - GAP - CARD.height })
      expect(panel().element.style.visibility).toBe('')
    })

    it('under the bar where there is no room over it and there is under it', async () => {
      mountInBar()
      layOut({ bar: { top: 200, right: 866 } })

      await open()

      expect(spot().top).toBe(200 + 76 + GAP)
    })

    // Four pixels to the screen's upper edge are not room: the choice keeps eight clear.
    it('under the bar where it would touch the screen’s upper edge over it', async () => {
      mountInBar()
      layOut({ bar: { top: CARD.height + GAP + 4, right: 866 } })

      await open()

      expect(spot().top).toBe(CARD.height + GAP + 4 + 76 + GAP)
    })

    it('at the screen’s upper edge where there is room on neither side and less is covered there', async () => {
      mountInBar()
      // 250 above the bar, 220 under it: over it the choice covers 24 of the bar, under it 54.
      layOut({ bar: { top: 250, right: 866, height: 30 }, screen: { width: 1280, height: 500 } })

      await open()

      expect(spot().top).toBe(EDGE)
    })

    it('at the screen’s lower edge where less is covered there', async () => {
      mountInBar()
      // 100 above the bar, 264 under it: under it the choice covers 10 of the bar, over it 174.
      layOut({ bar: { top: 100, right: 866, height: 30 }, screen: { width: 1280, height: 394 } })

      await open()

      expect(spot().top).toBe(394 - EDGE - CARD.height)
    })

    it('never above the screen, however low the screen is', async () => {
      mountInBar()
      // Under the bar it would cover less -- and would begin above the screen's upper edge.
      layOut({ bar: { top: 5, right: 866, height: 30 }, screen: { width: 1280, height: 250 } })

      await open()

      expect(spot().top).toBe(EDGE)
    })

    it('not out of the screen at the left where the bar is narrow', async () => {
      mountInBar()
      layOut({ bar: { top: 660, right: 250, width: 240 } })

      await open()

      expect(spot().left).toBe(EDGE)
    })

    it('not out of the screen at the right', async () => {
      mountInBar()
      layOut({ bar: { top: 660, right: 1500 }, screen: { width: 1280, height: 900 } })

      await open()

      expect(spot().left).toBe(1280 - EDGE - CARD.width)
    })

    // Until it is placed it has its size and is not seen: it would flash where the page put it.
    it('is not seen before it is placed', async () => {
      mountInBar()
      layOut({ bar: { top: 660, right: 866 } })

      toggle().element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
      await wrapper.vm.$nextTick()

      expect(panel().element.style.visibility).toBe('hidden')
      await flushPromises()
      expect(panel().element.style.visibility).toBe('')
    })

    // A choice that shut is unplaced again: opened a second time it goes the same way as the
    // first -- sized, not seen, then placed -- and is never drawn where it hung the time before.
    it('is not seen before it is placed when it opens a second time', async () => {
      mountInBar()
      layOut({ bar: { top: 660, right: 866 } })
      await open()
      await open()
      expect(panel().exists()).toBe(false)

      toggle().element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
      await wrapper.vm.$nextTick()

      expect(panel().element.style.visibility).toBe('hidden')
      await flushPromises()
      expect(panel().element.style.visibility).toBe('')
      expect(spot()).toEqual({ left: 866 - CARD.width, top: 660 - GAP - CARD.height })
    })

    it('hangs from the smiley itself where nothing around it is positioned', async () => {
      mountPicker()
      layOut({ bar: { top: 0, right: 0 } })
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
        if (this.classList.contains('emoji-picker-panel')) return { ...CARD, top: 0, left: 0 }
        if (this.classList.contains('emoji-picker')) {
          return { top: 500, right: 700, bottom: 532, left: 668, width: 32, height: 32 }
        }
        return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }
      })

      await open()

      expect(spot()).toEqual({ left: 700 - CARD.width, top: 500 - GAP - CARD.height })
    })

    describe('when what it hangs from moves', () => {
      const moved = { top: 500, right: 866 }
      const before = { left: 866 - CARD.width, top: 660 - GAP - CARD.height }
      const after = { left: 866 - CARD.width, top: 500 - GAP - CARD.height }
      const openOverBar = async (press = BY_MOUSE) => {
        mountInBar()
        layOut({ bar: { top: 660, right: 866 } })
        if (press === BY_KEY) toggle().element.focus()
        await open(press)
        expect(spot()).toEqual(before)
        laidOut.bar = moved
      }

      it('follows when the window changes its size', async () => {
        await openOverBar()

        window.dispatchEvent(new Event('resize'))
        await wrapper.vm.$nextTick()

        expect(spot()).toEqual(after)
      })

      // A scroll does not go up through the page: it is caught on its way down.
      it('follows when the page or a window’s body is moved', async () => {
        await openOverBar()

        field.dispatchEvent(new Event('scroll'))
        await wrapper.vm.$nextTick()

        expect(spot()).toEqual(after)
      })

      // A window whose thread gives way to a growing field moves that thread, and says so as any
      // scrolling does: under the pointer the choice stays all the same.
      it('does not follow a moving page while the pointer is on it', async () => {
        await openOverBar()
        const card = panel().element
        const matches = card.matches.bind(card)
        card.matches = (selector) => selector === ':hover' || matches(selector)

        field.dispatchEvent(new Event('scroll'))
        window.dispatchEvent(new Event('resize'))
        await wrapper.vm.$nextTick()

        expect(spot()).toEqual(before)
      })

      // A field that grew with its emoji raised the bar: the emoji stay under the pointer.
      it('stays where it is under the pointer that presses an emoji', async () => {
        await openOverBar()

        await click(emoji('🙏'), BY_MOUSE)
        await flushPromises()

        expect(field.value).toBe('🙏')
        expect(spot()).toEqual(before)
      })

      it('follows once the pointer has left it', async () => {
        await openOverBar()
        await click(emoji('🙏'), BY_MOUSE)
        await flushPromises()

        panel().element.dispatchEvent(new Event('pointerleave'))
        await wrapper.vm.$nextTick()

        expect(spot()).toEqual(after)
      })

      it('follows at once when the emoji was chosen by the keyboard', async () => {
        await openOverBar(BY_KEY)

        await click(emoji('🙏'), BY_KEY)
        await flushPromises()

        expect(spot()).toEqual(after)
      })

      it('is placed afresh each time it opens', async () => {
        await openOverBar()
        await click(toggle(), BY_MOUSE)

        await open()

        expect(spot()).toEqual(after)
      })
    })

    it('stands in the corner of what wraps a form’s field when asked to', () => {
      mountPicker({ corner: true })

      expect(wrapper.classes()).toContain('is-corner')
    })

    it('is a part of its row otherwise', () => {
      mountPicker()

      expect(wrapper.classes()).not.toContain('is-corner')
    })
  })

  // jsdom lays nothing out: what the stylesheet has to say is read from it, without its comments
  // -- the comments explain the rules in the rules' own words.
  describe('the stylesheet', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'EmojiPicker.vue'),
      'utf8',
    )
    const style = source.slice(source.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) => {
      const at = style.indexOf(`${selector} {`)
      expect(at).toBeGreaterThan(-1)
      return style.slice(at, style.indexOf('}', at))
    }

    it('has as many columns as a row has emoji', () => {
      expect(rule('.emoji-picker-row')).toContain(`repeat(${EMOJI_ROWS[0].length}, `)
    })

    it('lets the columns give way, so the choice is never wider than the screen', () => {
      expect(rule('.emoji-picker-row')).toContain('minmax(0, 2.25rem)')
      expect(rule('.emoji-picker-panel')).toContain('max-width: calc(100vw - 1rem)')
    })

    // Left to the room it finds, it would be narrower the nearer it stands to the screen's edge.
    it('makes the choice as wide as its emoji, wherever it hangs', () => {
      expect(rule('.emoji-picker-panel')).toContain('width: max-content')
    })

    // Over the page, in the screen's own pixels: no ancestor cuts it off, nothing gives way to it.
    it('hangs the choice over the page, over everything of the page it is on', () => {
      expect(rule('.emoji-picker-panel')).toContain('position: fixed')
      expect(rule('.emoji-picker-panel')).toMatch(/z-index: 10[34]\d;/)
    })

    it('asks for the device’s coloured drawing of an emoji by name', () => {
      const font = rule('.emoji-picker-emoji')
      expect(font).toContain("'Apple Color Emoji'")
      expect(font).toContain("'Segoe UI Emoji'")
      expect(font).toContain("'Noto Color Emoji'")
    })

    it('shows the keyboard where it stands, on the smiley and on an emoji', () => {
      expect(rule('.emoji-picker-toggle:focus-visible')).toContain('outline: 2px solid')
      expect(rule('.emoji-picker-emoji:focus-visible')).toContain('outline: 2px solid')
    })

    it('puts the smiley into the corner in a form, out of the flow', () => {
      const corner = rule('.emoji-picker.is-corner .emoji-picker-toggle')
      expect(corner).toContain('position: absolute')
      expect(corner).toContain('right: 0')
      expect(rule('.emoji-picker.is-corner')).toContain('display: block')
    })
  })
})
