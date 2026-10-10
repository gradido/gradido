// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChatComposeBar from './ChatComposeBar.vue'
import EmojiPicker from '@/components/Inputs/EmojiPicker.vue'
import { isComputer } from '@/utils/isComputer'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

// A computer unless a test says otherwise: the smiley is a computer's (utils/emojiChoice).
vi.mock('@/utils/isComputer', () => ({ isComputer: vi.fn(() => true) }))

/**
 * The smiley in the compose bar (Bernd, 10.10.2026), with the real choice behind it: what must
 * hold is that an emoji pressed ends up in the message that goes out, and a stand-in for the
 * choice would agree to anything. The choice itself has its own spec (EmojiPicker.spec.js).
 */
describe('ChatComposeBar, the smiley', () => {
  let wrapper

  // In the page: the choice finds the bar's field by its id.
  const mountBar = (props = {}) => {
    wrapper = mount(ChatComposeBar, {
      props: { name: 'Lena', first: false, sending: false, failed: false, ...props },
      attachTo: document.body,
      global: {
        stubs: {
          IMdiEmailOutline: true,
          IMdiSend: true,
          IMdiPaperclip: true,
          IMdiImage: true,
          IMdiCamera: true,
          IMdiFileDocument: true,
          IMdiClose: true,
          IMdiPencilOutline: true,
          IMdiCheck: true,
          IMdiReplyOutline: true,
          IMdiImageOutline: true,
          IMdiCellphone: true,
          IMdiOpenInNew: true,
          IMdiEmoticonHappyOutline: true,
          ChatImageEditor: true,
          BModal: true,
        },
      },
    })
    return wrapper
  }

  const field = () => wrapper.find('[data-test="chat-compose-field"]')
  const send = () => wrapper.find('[data-test="chat-compose-send"]')
  const smiley = () => wrapper.find('[data-test="emoji-picker-toggle"]')
  const choice = () => wrapper.find('[data-test="emoji-picker-panel"]')
  const emoji = (sign) =>
    wrapper
      .findAll('[data-test="emoji-picker-emoji"]')
      .find((button) => button.element.textContent.trim() === sign)
  /** A click of the mouse, as the browser sends it (`detail` 1; the test utils cannot set it). */
  const click = async (target) => {
    target.element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
    )
    await flushPromises()
  }
  const escIn = async (target) => {
    target.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await flushPromises()
  }
  const typed = async (words, caret = words.length) => {
    await field().setValue(words)
    field().element.setSelectionRange(caret, caret)
  }

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
    vi.mocked(isComputer).mockReturnValue(true)
  })

  describe('where it stands', () => {
    it('is in the row behind the field and before the arrow, as Tab goes', () => {
      mountBar()

      const row = wrapper.find('.chat-compose-row').element
      const order = [...row.children].map(
        (child) => child.dataset.test ?? child.querySelector('[data-test]')?.dataset.test,
      )
      const at = (name) => order.indexOf(name)
      expect(at('emoji-picker')).toBeGreaterThan(-1)
      expect(at('emoji-picker')).toBeGreaterThan(at('chat-compose-field'))
      expect(at('emoji-picker')).toBeLessThan(at('chat-compose-send'))
    })

    it('belongs to the bar’s own field', () => {
      mountBar()

      const picker = wrapper.findComponent(EmojiPicker)
      expect(picker.props('fieldId')).toBe(field().attributes('id'))
      expect(document.getElementById(picker.props('fieldId'))).toBe(field().element)
      // A part of the row -- not in a corner, as at a form's label.
      expect(picker.props('corner')).toBe(false)
    })

    it('carries the bar’s class, by which the bar draws it into the field', () => {
      mountBar()

      expect(wrapper.find('[data-test="emoji-picker"]').classes()).toContain('chat-compose-emoji')
      // The words keep clear of it.
      expect(field().classes()).toContain('has-emoji')
    })

    // A phone and a tablet have the emoji on their keyboard, a tap away.
    it('is not there on a phone or a tablet, and the field is as it always was', () => {
      vi.mocked(isComputer).mockReturnValue(false)
      mountBar()

      expect(wrapper.findComponent(EmojiPicker).exists()).toBe(false)
      expect(smiley().exists()).toBe(false)
      expect(field().classes()).not.toContain('has-emoji')
    })

    // An emoji is text: wherever words are written, the smiley stands.
    it.each([
      ['before the first message of two', { first: true }],
      ['in the text-only form, which has no paperclip', { textOnly: true, first: true }],
      ['at the profile of the map, which says its own words', { first: true, firstNote: false }],
      ['in a group', { group: true, name: 'Gradido-Café', canAnnounce: true, announceTo: 3 }],
      ['beside the three short answers', { helloBack: true }],
      [
        'while the next message answers one',
        {
          replying: {
            messageUuid: 'u-1',
            mine: false,
            name: 'Lena',
            text: 'Bis dann',
            hasImage: false,
          },
        },
      ],
    ])('is there %s', (_where, props) => {
      mountBar(props)

      expect(smiley().exists()).toBe(true)
      expect(field().classes()).toContain('has-emoji')
    })

    it('is there while a message is being changed, where the paperclip is not', async () => {
      mountBar()
      await wrapper.setProps({
        editing: { messageUuid: 'u-7', body: 'Bis morgen', hasImage: false },
      })
      await flushPromises()

      expect(wrapper.find('[data-test="chat-compose-attach"]').exists()).toBe(false)
      expect(smiley().exists()).toBe(true)
    })
  })

  describe('an emoji pressed', () => {
    it('stands in the words, and the message goes out with it', async () => {
      mountBar()
      await typed('Danke ')
      await click(smiley())

      await click(emoji('🙏'))
      expect(field().element.value).toBe('Danke 🙏')
      await send().trigger('click')

      expect(wrapper.emitted('send')).toHaveLength(1)
      expect(wrapper.emitted('send')[0][0].body).toBe('Danke 🙏')
    })

    it('goes where the caret stands, not to the end', async () => {
      mountBar()
      await typed('Hallo Lena', 5)
      await click(smiley())

      await click(emoji('👋'))

      expect(field().element.value).toBe('Hallo👋 Lena')
    })

    // The arrow waits for words; an emoji alone is words enough.
    it('alone is a message', async () => {
      mountBar()
      expect(send().attributes('aria-disabled')).toBe('true')
      await click(smiley())

      await click(emoji('👍'))

      expect(send().attributes('aria-disabled')).toBe('false')
      await send().trigger('click')
      expect(wrapper.emitted('send')[0][0].body).toBe('👍')
    })

    it('leaves the choice open for the next one, and all of them go out', async () => {
      mountBar()
      await click(smiley())

      await click(emoji('🌱'))
      await click(emoji('🌻'))
      await click(emoji('☀️'))

      expect(choice().exists()).toBe(true)
      await send().trigger('click')
      expect(wrapper.emitted('send')[0][0].body).toBe('🌱🌻☀️')
    })

    it('goes into a message being changed, and is saved with it', async () => {
      mountBar()
      await wrapper.setProps({
        editing: { messageUuid: 'u-7', body: 'Bis morgen', hasImage: false },
      })
      await flushPromises()
      await click(smiley())

      await click(emoji('🙂'))
      await send().trigger('click')

      expect(wrapper.emitted('saveEdit')).toEqual([[{ messageUuid: 'u-7', body: 'Bis morgen🙂' }]])
    })

    it('is counted as the field counts it: two of the characters that are left', async () => {
      mountBar()
      await typed('a'.repeat(1900))
      const left = () => wrapper.find('[data-test="chat-compose-remaining"]').text()
      expect(left()).toBe('chatThread.remaining {"n":100}')
      await click(smiley())

      await click(emoji('🙏'))

      expect(left()).toBe('chatThread.remaining {"n":98}')
    })

    it('is not put in by halves where the field is all but full', async () => {
      mountBar()
      await typed('a'.repeat(1999))
      await click(smiley())

      await click(emoji('🙏'))

      expect(field().element.value).toHaveLength(1999)
    })

    it('stays in the field when a message could not be sent', async () => {
      mountBar()
      await typed('Bis gleich ')
      await click(smiley())
      await click(emoji('☕'))
      await send().trigger('click')

      await wrapper.setProps({ sending: true })
      await wrapper.setProps({ sending: false, failed: true })
      await flushPromises()

      expect(field().element.value).toBe('Bis gleich ☕')
    })

    it('is gone with the message that went out', async () => {
      mountBar()
      await typed('Bis gleich ')
      await click(smiley())
      await click(emoji('☕'))
      await send().trigger('click')

      await wrapper.setProps({ sending: true })
      await wrapper.setProps({ sending: false })
      await flushPromises()

      expect(field().element.value).toBe('')
    })
  })

  // An emoji pressed while a message is on its way would stay behind with the words that went
  // out. A press on the arrow shuts the choice by itself (it is a press elsewhere); the keys do not.
  describe('a message that goes out', () => {
    const sendByKeys = async () => {
      field().element.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      )
      await flushPromises()
    }

    it('shuts the choice when it is sent from the field with Cmd+Enter', async () => {
      mountBar()
      await typed('Bis gleich ')
      await click(smiley())
      await click(emoji('☕'))
      expect(choice().exists()).toBe(true)

      await sendByKeys()

      expect(wrapper.emitted('send')[0][0].body).toBe('Bis gleich ☕')
      expect(choice().exists()).toBe(false)
    })

    it('leaves the choice open where there was nothing to send', async () => {
      mountBar()
      await click(smiley())

      await sendByKeys()

      expect(wrapper.emitted('send')).toBeUndefined()
      expect(choice().exists()).toBe(true)
    })

    it('shuts the choice when a change is saved with Cmd+Enter', async () => {
      mountBar()
      await wrapper.setProps({
        editing: { messageUuid: 'u-7', body: 'Bis morgen', hasImage: false },
      })
      await flushPromises()
      await click(smiley())
      await click(emoji('🙂'))

      await sendByKeys()

      expect(wrapper.emitted('saveEdit')).toHaveLength(1)
      expect(choice().exists()).toBe(false)
    })

    it('shuts the choice when a short answer goes out by the keyboard', async () => {
      mountBar({ helloBack: true })
      await click(smiley())
      expect(choice().exists()).toBe(true)

      // A key on the button: a click without a pointer, and no press that would shut the choice.
      await wrapper.find('[data-test="chat-compose-hello-back-hello"]').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('send')).toHaveLength(1)
      expect(choice().exists()).toBe(false)
    })
  })

  // Beyond five lines the field scrolls inside. Where its scrollbar takes room, it stands where
  // the smiley is: the bar tells the stylesheet how wide it is.
  describe('a field with a scrollbar', () => {
    const withScrollbar = (width) => {
      const box = field().element
      Object.defineProperty(box, 'offsetWidth', { configurable: true, get: () => 360 })
      Object.defineProperty(box, 'clientLeft', { configurable: true, get: () => 1 })
      Object.defineProperty(box, 'clientWidth', { configurable: true, get: () => 358 - width })
    }
    const told = () => wrapper.element.style.getPropertyValue('--field-scrollbar')

    it('tells the bar how wide the scrollbar is, as the words are typed', async () => {
      mountBar()
      withScrollbar(15)

      await field().setValue('eins\nzwei\ndrei\nvier\nfünf\nsechs')

      expect(told()).toBe('15px')
    })

    it('tells it there is none where the scrollbar lies over the words, or the field is short', async () => {
      mountBar()
      withScrollbar(0)

      await field().setValue('kurz')

      expect(told()).toBe('0px')
    })

    it('takes the scrollbar back when the field is short again', async () => {
      mountBar()
      withScrollbar(15)
      await field().setValue('eins\nzwei\ndrei\nvier\nfünf\nsechs')
      withScrollbar(0)

      await field().setValue('kurz')

      expect(told()).toBe('0px')
    })

    // Rounded widths of a zoomed page can come out a pixel short: never less than nothing.
    it('never tells less than nothing', async () => {
      mountBar()
      const box = field().element
      Object.defineProperty(box, 'offsetWidth', { configurable: true, get: () => 360 })
      Object.defineProperty(box, 'clientLeft', { configurable: true, get: () => 1 })
      Object.defineProperty(box, 'clientWidth', { configurable: true, get: () => 359 })

      await field().setValue('kurz')

      expect(told()).toBe('0px')
    })

    it('tells nothing on a phone, which has no smiley', async () => {
      vi.mocked(isComputer).mockReturnValue(false)
      mountBar()
      withScrollbar(15)

      await field().setValue('eins\nzwei\ndrei\nvier\nfünf\nsechs')

      expect(told()).toBe('')
    })
  })

  // The bar's field has an Esc of its own: it lets go of a message being changed, or of an answer.
  describe('Esc in the field while the choice is open', () => {
    it('closes the choice and does not let go of the message being changed', async () => {
      mountBar()
      await wrapper.setProps({
        editing: { messageUuid: 'u-7', body: 'Bis morgen', hasImage: false },
      })
      await flushPromises()
      await click(smiley())
      expect(choice().exists()).toBe(true)

      await escIn(field())

      expect(choice().exists()).toBe(false)
      expect(wrapper.emitted('cancelEdit')).toBeUndefined()
    })

    it('lets go of it with the next Esc, as always', async () => {
      mountBar()
      await wrapper.setProps({
        editing: { messageUuid: 'u-7', body: 'Bis morgen', hasImage: false },
      })
      await flushPromises()
      await click(smiley())
      await escIn(field())

      await escIn(field())

      expect(wrapper.emitted('cancelEdit')).toHaveLength(1)
    })

    it('closes the choice and does not let go of the answer', async () => {
      mountBar({
        replying: {
          messageUuid: 'u-1',
          mine: false,
          name: 'Lena',
          text: 'Bis dann',
          hasImage: false,
        },
      })
      await click(smiley())

      await escIn(field())

      expect(choice().exists()).toBe(false)
      expect(wrapper.emitted('cancelReply')).toBeUndefined()
    })
  })

  /**
   * ⛔ What only the stylesheets hold (jsdom lays nothing out), comments stripped first -- they
   * explain the rules in the rules' own numbers.
   *
   * The smiley is drawn back over the field's right end. Its width, its two margins and the row's
   * gap must come to nothing: then the field and the arrow stand exactly where they stand without
   * it. The numbers are in two files, and one changed alone would move the arrow.
   */
  describe('in the stylesheets', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const styleOf = (file) => {
      const code = readFileSync(file, 'utf8')
      return code.slice(code.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')
    }
    const bar = styleOf(join(here, 'ChatComposeBar.vue'))
    const picker = styleOf(join(here, '..', 'Inputs', 'EmojiPicker.vue'))
    const rule = (code, selector) =>
      code.match(new RegExp(`\\n${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    const rem = (css, property) => {
      const found = css.match(new RegExp(`(?:^|\\s)${property}:\\s*(-?[0-9.]+)rem;`))
      expect(found, `no ${property} in rem`).not.toBeNull()
      return Number(found[1])
    }
    /**
     * The smiley's margins: right and left each a length and the width of the field's scrollbar,
     * added on the right and taken on the left -- `scrollbar` says whether both carry it so.
     */
    const margins = () => {
      const found = rule(bar, '.chat-compose-emoji')
        .replace(/\s+/g, ' ')
        .match(
          /margin: 0 calc\((-?[0-9.]+)rem \+ var\(--field-scrollbar, 0px\)\) (-?[0-9.]+)rem calc\((-?[0-9.]+)rem - var\(--field-scrollbar, 0px\)\);/,
        )
      expect(found, 'no margin of four values on the smiley').not.toBeNull()
      return { right: Number(found[1]), bottom: Number(found[2]), left: Number(found[3]) }
    }

    it('take as much room back as the smiley takes: the field and the arrow do not move', () => {
      const width = rem(rule(picker, '.emoji-picker-toggle'), 'width')
      const gap = rem(rule(bar, '.chat-compose-row'), 'gap')
      const { left, right } = margins()

      expect(width + left + right + gap).toBeCloseTo(0, 9)
    })

    it('keep the words clear of the smiley', () => {
      const gap = rem(rule(bar, '.chat-compose-row'), 'gap')
      const { left } = margins()
      // How far the smiley reaches into the field from the field's right edge.
      const reach = -(gap + left)

      expect(reach).toBeGreaterThan(0)
      expect(rem(rule(bar, '.chat-compose-field.has-emoji'), 'padding-right')).toBeGreaterThan(
        reach,
      )
    })

    it('lift the smiley off the field’s lower rim as far as off its right one', () => {
      const { right, bottom } = margins()

      expect(bottom).toBe(right)
      expect(bottom).toBeGreaterThan(0)
    })
  })
})
