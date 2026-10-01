// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { BModal } from 'bootstrap-vue-next'
import ChatComposeBar from './ChatComposeBar.vue'
import { SWISSTRANSFER_URL } from '@/utils/chatFileLink'
import { isComputer } from '@/utils/isComputer'
import { CHAT_IMAGE_UNEDITED } from '@/utils/chatImageEdit'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

// A computer unless a test says otherwise; the check itself has its own spec.
vi.mock('@/utils/isComputer', () => ({ isComputer: vi.fn(() => true) }))

/**
 * Opening a picture and making it small have their own spec (utils/chatImage.spec.js); here they
 * answer as a test says -- with a picture, a refusal, or not yet.
 */
const encoding = vi.hoisted(() => ({ openChatImage: vi.fn(), encodeChatImage: vi.fn() }))
vi.mock('@/utils/chatImage', () => ({
  openChatImage: (...args) => encoding.openChatImage(...args),
  encodeChatImage: (...args) => encoding.encodeChatImage(...args),
}))

describe('ChatComposeBar', () => {
  let wrapper

  const mountBar = (props = {}, options = {}) => {
    wrapper = mount(ChatComposeBar, {
      props: { name: 'Lena', first: false, sending: false, failed: false, ...props },
      global: {
        stubs: {
          IMdiEmailOutline: true,
          IMdiSend: true,
          IMdiPaperclip: true,
          IMdiImage: true,
          IMdiCamera: true,
          IMdiFileDocument: true,
          IMdiClose: true,
          IMdiPencil: true,
          // The strip over the field and the tick while a message is being changed (E-060).
          IMdiPencilOutline: true,
          IMdiCheck: true,
          // The editor has its own spec; here it shows what it was given and answers as a test says.
          ChatImageEditor: {
            name: 'ChatImageEditor',
            props: ['modelValue', 'source', 'edit'],
            emits: ['update:modelValue', 'done'],
            template: '<div data-test="chat-image-editor-stub" />',
          },
          IMdiCellphone: true,
          IMdiOpenInNew: true,
          // Shows what it holds while it is open, the footer under it. The names written on the
          // real tag are held against the installed package below.
          BModal: {
            name: 'BModal',
            props: { modelValue: Boolean },
            emits: ['update:modelValue'],
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
        },
      },
      ...options,
    })
    return wrapper
  }

  const field = () => wrapper.find('[data-test="chat-compose-field"]')
  const button = () => wrapper.find('[data-test="chat-compose-send"]')
  const box = () => wrapper.find('[data-test="chat-compose-email"]')
  const sent = () => wrapper.emitted('send') ?? []

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
    vi.mocked(isComputer).mockClear()
    vi.mocked(isComputer).mockReturnValue(true)
    encoding.openChatImage.mockReset()
    encoding.encodeChatImage.mockReset()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  /**
   * A group's bar (P5): the group's name in the field, no sentence about a first mail -- the mail
   * "taken in" was the first word -- and the box is the announcement (E-050 F5), for the owner and
   * the moderators only.
   */
  describe('in a group', () => {
    const inGroup = (props = {}) =>
      mountBar({
        name: 'Gradido-Café Berlin',
        group: true,
        canAnnounce: true,
        announceTo: 4,
        ...props,
      })
    const words = () => wrapper.find('[data-test="chat-compose-email-words"]').text()

    it("puts the group's name into the field", () => {
      inGroup()
      expect(field().attributes('placeholder')).toBe(
        'chatGroup.placeholder {"name":"Gradido-Café Berlin"}',
      )
    })

    it('offers the announcement, and says how many it reaches once ticked', async () => {
      inGroup()
      expect(words()).toBe('chatGroup.announce')
      await box().setValue(true)
      expect(words()).toBe('chatGroup.announceTo {"n":4}')
    })

    it('offers no box to a plain member', () => {
      inGroup({ canAnnounce: false })
      expect(box().exists()).toBe(false)
    })

    // What the thread makes of it: EMAIL is the announcement, NONE a plain message.
    it('asks for the mail where the box is ticked, and for none where it is not', async () => {
      inGroup()
      await field().setValue('Samstag')
      await box().setValue(true)
      await button().trigger('click')
      await field().setValue('Sonntag')
      await box().setValue(false)
      await button().trigger('click')
      expect(sent().map(([message]) => message.notify)).toEqual(['EMAIL', 'NONE'])
    })

    // A box ticked by a moderator who is none any more, since the window told the bar, is no wish.
    it('sends no announcement once the box is gone', async () => {
      inGroup()
      await box().setValue(true)
      await wrapper.setProps({ canAnnounce: false })
      await field().setValue('Samstag')
      await button().trigger('click')
      expect(sent()[0][0].notify).toBe('NONE')
    })

    // Gegenprobe: the bar of two says what it always said.
    it('keeps the words of a conversation of two outside a group', async () => {
      mountBar()
      expect(field().attributes('placeholder')).toBe('chatThread.placeholder {"name":"Lena"}')
      expect(words()).toBe('chatThread.alsoByEmail')
      await box().setValue(true)
      expect(words()).toBe('chatThread.alsoByEmailTo {"name":"Lena"}')
    })
  })

  describe('what it shows', () => {
    // A field with a name a screen reader reads, a button with one, a real box with its word.
    it('names the field, the button and the box', () => {
      mountBar()

      const label = wrapper.find(`label[for="${field().attributes('id')}"]`)
      expect(label.text()).toBe('chatThread.placeholder {"name":"Lena"}')
      expect(label.classes()).toContain('visually-hidden')
      expect(field().element.tagName).toBe('TEXTAREA')
      expect(field().attributes('placeholder')).toBe('chatThread.placeholder {"name":"Lena"}')

      expect(button().element.tagName).toBe('BUTTON')
      expect(button().attributes('type')).toBe('button')
      expect(button().attributes('aria-label')).toBe('chatThread.send')

      expect(box().element.tagName).toBe('INPUT')
      expect(box().attributes('type')).toBe('checkbox')
      expect(box().element.closest('label').textContent.trim()).toBe('chatThread.alsoByEmail')
    })

    // E-024: the first message of a pair goes out as a mail whatever is asked -- nothing to
    // choose, so a sentence stands where the box would.
    it('says the first message goes by mail too, and has no box for it', () => {
      mountBar({ first: true })

      const sentence = wrapper.find('[data-test="chat-compose-first"]')
      expect(sentence.text()).toBe('chatThread.firstGoesByEmail {"name":"Lena"}')
      expect(box().exists()).toBe(false)
      // …and the field says it too, to whoever lands in it by keyboard.
      expect(field().attributes('aria-describedby')).toContain(sentence.attributes('id'))
    })

    /**
     * Ticked, the word names who gets the mail. And the box carries its word and nothing
     * else, at the desk as on the phone (Bernd, 24.09.2026): no sentence beside it on what an
     * empty box means.
     */
    it('names the person once the box is ticked, and says nothing more', async () => {
      mountBar()
      const options = wrapper.find('.chat-compose-options')
      expect(options.text()).toBe('chatThread.alsoByEmail')

      await box().setValue(true)

      expect(wrapper.find('[data-test="chat-compose-email-label"]').text()).toBe(
        'chatThread.alsoByEmailTo {"name":"Lena"}',
      )
      expect(options.text()).toBe('chatThread.alsoByEmailTo {"name":"Lena"}')
    })

    it('stops at the length the server takes', () => {
      mountBar()
      expect(field().attributes('maxlength')).toBe('2000')
    })

    /**
     * The count appears only near the end: under 200 characters left, not at 200 -- under
     * every message it would be a number nobody needs.
     */
    it('counts what is left only under 200 characters', async () => {
      mountBar()

      await field().setValue('x'.repeat(1800))
      expect(wrapper.find('[data-test="chat-compose-remaining"]').exists()).toBe(false)

      await field().setValue('x'.repeat(1801))
      const count = wrapper.find('[data-test="chat-compose-remaining"]')
      expect(count.text()).toBe('chatThread.remaining {"n":199}')
      expect(field().attributes('aria-describedby')).toContain(count.attributes('id'))
    })
  })

  describe('sending', () => {
    // Nothing to send, nothing sent -- and the button says so.
    it('sends nothing while the field is empty or holds only spaces', async () => {
      mountBar()
      expect(button().attributes('aria-disabled')).toBe('true')
      await button().trigger('click')

      await field().setValue('   \n  ')
      expect(button().attributes('aria-disabled')).toBe('true')
      await button().trigger('click')

      expect(sent()).toEqual([])
    })

    it('sends the text without the space around it, and no mail unless the box says so', async () => {
      mountBar()
      await field().setValue('  Hallo Lena  \n')
      expect(button().attributes('aria-disabled')).toBe('false')

      await button().trigger('click')

      expect(sent()).toEqual([[{ body: 'Hallo Lena', notify: 'NONE', image: null }]])
    })

    it('asks for the mail where the box is ticked', async () => {
      mountBar()
      await field().setValue('Hallo Lena')
      await box().setValue(true)

      await button().trigger('click')

      expect(sent()).toEqual([[{ body: 'Hallo Lena', notify: 'EMAIL', image: null }]])
    })

    // The server mails the first message anyway; the request says what will happen.
    it('asks for the mail with the first message, without a box', async () => {
      mountBar({ first: true })
      await field().setValue('Hallo Lena')

      await button().trigger('click')

      expect(sent()).toEqual([[{ body: 'Hallo Lena', notify: 'EMAIL', image: null }]])
    })

    /**
     * ⛔ Enter is a new line, as in every text field. Many in the community did not grow up
     * with chat programs, and a message gone half-written cannot be called back.
     */
    it('does not send on Enter', async () => {
      mountBar()
      await field().setValue('Hallo')

      await field().trigger('keydown', { key: 'Enter' })
      await field().trigger('keydown', { key: 'Enter', shiftKey: true })

      expect(sent()).toEqual([])
    })

    it('sends on Cmd+Enter and on Ctrl+Enter', async () => {
      mountBar()
      await field().setValue('Hallo')

      await field().trigger('keydown', { key: 'Enter', metaKey: true })
      await field().trigger('keydown', { key: 'Enter', ctrlKey: true })

      expect(sent()).toEqual([
        [{ body: 'Hallo', notify: 'NONE', image: null }],
        [{ body: 'Hallo', notify: 'NONE', image: null }],
      ])
    })

    // One message on its way at a time: a second press is turned away.
    it('waits while a message is on its way', async () => {
      mountBar({ sending: true })
      await field().setValue('Hallo')

      expect(button().attributes('aria-disabled')).toBe('true')
      await button().trigger('click')
      await field().trigger('keydown', { key: 'Enter', metaKey: true })

      expect(sent()).toEqual([])
    })
  })

  describe('after sending', () => {
    /**
     * A message that went through: the field empties, the box is empty again -- the wish is
     * for one message (E-024) -- and the keyboard stays in the field for the next one.
     */
    it('empties the field and the box, and keeps the focus in the field', async () => {
      mountBar({}, { attachTo: document.body })
      await field().setValue('Hallo')
      await box().setValue(true)
      field().element.focus()
      await button().trigger('click')

      await wrapper.setProps({ sending: true })
      await wrapper.setProps({ sending: false })
      await flushPromises()

      expect(field().element.value).toBe('')
      expect(box().element.checked).toBe(false)
      expect(document.activeElement).toBe(field().element)
      expect(wrapper.find('[data-test="chat-compose-failed"]').exists()).toBe(false)
    })

    // Gegenprobe: a tap elsewhere while the message was on its way is not taken back.
    it('leaves the focus where the member moved it meanwhile', async () => {
      const elsewhere = document.createElement('button')
      document.body.appendChild(elsewhere)
      mountBar({}, { attachTo: document.body })
      await field().setValue('Hallo')
      await button().trigger('click')

      await wrapper.setProps({ sending: true })
      elsewhere.focus()
      await wrapper.setProps({ sending: false })
      await flushPromises()

      expect(field().element.value).toBe('')
      expect(document.activeElement).toBe(elsewhere)
    })

    /**
     * ⛔ The text is never lost but by sending it. A message that did not go through leaves
     * the text and the box as they were, and a line under the bar says so -- here, where it
     * happened, not in a toast.
     */
    it('keeps the text and the box where a message did not go through, and says so', async () => {
      mountBar()
      await field().setValue('Hallo')
      await box().setValue(true)
      await button().trigger('click')

      await wrapper.setProps({ sending: true })
      await wrapper.setProps({ sending: false, failed: true })
      await flushPromises()

      expect(field().element.value).toBe('Hallo')
      expect(box().element.checked).toBe(true)
      const line = wrapper.find('[data-test="chat-compose-failed"]')
      expect(line.text()).toBe('chatThread.notSent')
      expect(line.attributes('role')).toBe('alert')
    })

    /**
     * ⛔ Only what went out is cleared. The field stays writable while the message is on its
     * way, and what the member typed meanwhile is theirs (coderabbit, PR #3974); the box
     * belonged to the message that went out.
     */
    it('keeps text typed while the message was on its way', async () => {
      mountBar()
      await field().setValue('Hallo')
      await box().setValue(true)
      await button().trigger('click')
      await wrapper.setProps({ sending: true })

      await field().setValue('Hallo\nUnd noch etwas')
      await wrapper.setProps({ sending: false })
      await flushPromises()

      expect(field().element.value).toBe('Hallo\nUnd noch etwas')
      expect(box().element.checked).toBe(false)
    })

    // …and a box ticked while the message was on its way is a wish for the next one.
    it('keeps a box ticked while the message was on its way', async () => {
      mountBar()
      await field().setValue('Hallo')
      await button().trigger('click')
      await wrapper.setProps({ sending: true })

      await box().setValue(true)
      await wrapper.setProps({ sending: false })
      await flushPromises()

      expect(field().element.value).toBe('')
      expect(box().element.checked).toBe(true)
    })
  })

  /**
   * Paket D (E-042, E-044): a file goes through SwissTransfer. The paperclip at the left of the
   * field opens a short hint straight away -- three steps, what the service is, the way there.
   */
  /**
   * The words not sent yet, across a restart of the wallet (utils/chatReturn): the thread reads
   * them from the bar when the page goes out of sight, and hands them back when it is made anew.
   */
  describe('the words across a restart', () => {
    it('begins with the words it is given, and can send them', async () => {
      mountBar({ initialText: 'Hier ist die Datei:' })

      expect(field().element.value).toBe('Hier ist die Datei:')
      await button().trigger('click')
      expect(sent()[0][0].body).toBe('Hier ist die Datei:')
    })

    it('begins empty without them', () => {
      mountBar()
      expect(field().element.value).toBe('')
    })

    it('tells the words as they stand, typed or given', async () => {
      mountBar({ initialText: 'Hier ist' })
      expect(wrapper.vm.draft()).toBe('Hier ist')

      await field().setValue('Hier ist die Datei:\n')
      expect(wrapper.vm.draft()).toBe('Hier ist die Datei:\n')
    })
  })

  /**
   * E-060 B1 (Bernd, 01.10.2026): a message of one's own is changed in the field it was written
   * in. The thread hands the message in (`editing`); the bar shows its text to be changed, says
   * so over the field, turns the arrow into a tick -- and gives back what stood in it before.
   */
  describe('a message being changed (E-060)', () => {
    const MESSAGE = {
      messageUuid: 'uuid-7',
      body: 'Der Hofflohmarkt ist am Samstag ab 10 Uhr.',
      hasImage: false,
    }
    const CAPTION = { messageUuid: 'uuid-9', body: 'Unser Stand', hasImage: true }
    const strip = () => wrapper.find('[data-test="chat-compose-editing"]')
    const cross = () => wrapper.find('[data-test="chat-compose-edit-cancel"]')
    const problemLine = () => wrapper.find('[data-test="chat-compose-edit-problem"]')
    const failedLine = () => wrapper.find('[data-test="chat-compose-failed"]')
    const clip = () => wrapper.find('[data-test="chat-compose-attach"]')
    const attached = () => wrapper.find('[data-test="chat-compose-attached"]')
    const saved = () => wrapper.emitted('saveEdit') ?? []
    const letGo = () => wrapper.emitted('cancelEdit') ?? []

    const startEditing = async (message = MESSAGE) => {
      await wrapper.setProps({ editing: message })
      await flushPromises()
    }
    const stopEditing = async () => {
      await wrapper.setProps({ editing: null, editProblem: '' })
      await flushPromises()
    }

    /** A picture chosen, as the device's picker answers; jsdom's canvas draws nothing. */
    const READY = { image: { name: 'ready' }, width: 4000, height: 3000 }
    const quietCanvas = () =>
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        drawImage: () => {},
      }))
    const choose = async () => {
      const picker = wrapper.find('[data-test="chat-compose-picker"]')
      Object.defineProperty(picker.element, 'files', {
        value: [new File(['JPEG'], 'photo.jpg', { type: 'image/jpeg' })],
        configurable: true,
      })
      await picker.trigger('change')
      await flushPromises()
    }

    it('takes the text into the field, the keyboard behind its last character', async () => {
      mountBar({}, { attachTo: document.body })

      await startEditing()

      expect(field().element.value).toBe(MESSAGE.body)
      expect(document.activeElement).toBe(field().element)
      expect(field().element.selectionStart).toBe(MESSAGE.body.length)
      expect(field().element.selectionEnd).toBe(MESSAGE.body.length)
      expect(field().attributes('placeholder')).toBe('chatThread.editPlaceholder')
    })

    it('says over the field what is being changed, with the words as they were', async () => {
      mountBar()
      expect(strip().exists()).toBe(false)

      await startEditing()

      expect(strip().find('.chat-compose-editing-title').text()).toBe('chatThread.editing')
      expect(wrapper.find('[data-test="chat-compose-editing-text"]').text()).toBe(MESSAGE.body)
      // The field is described by it: a screen reader hears what the field holds now.
      const title = strip().find('.chat-compose-editing-title')
      expect(field().attributes('aria-describedby').split(' ')).toContain(title.attributes('id'))
      // The words as they WERE: typing does not change the strip.
      await field().setValue('Etwas ganz anderes')
      expect(wrapper.find('[data-test="chat-compose-editing-text"]').text()).toBe(MESSAGE.body)
    })

    // A picture without a caption: nothing to show as "the words as they were".
    it('shows no line of words for a picture without a caption', async () => {
      mountBar()

      await startEditing({ ...CAPTION, body: '' })

      expect(strip().exists()).toBe(true)
      expect(wrapper.find('[data-test="chat-compose-editing-text"]').exists()).toBe(false)
      expect(field().attributes('placeholder')).toBe('chatThread.imageCaption')
    })

    it('turns the arrow into a tick that says what it does', async () => {
      mountBar()
      expect(button().classes()).not.toContain('is-save')
      expect(button().attributes('aria-label')).toBe('chatThread.send')
      expect(button().find('i-mdi-send-stub').exists()).toBe(true)

      await startEditing()

      expect(button().classes()).toContain('is-save')
      expect(button().attributes('aria-label')).toBe('chatThread.editSave')
      expect(button().attributes('title')).toBe('chatThread.editSave')
      expect(button().find('i-mdi-check-stub').exists()).toBe(true)
      expect(button().find('i-mdi-send-stub').exists()).toBe(false)
    })

    // Nothing else goes with a change: no picture, no mail, no announcement.
    it('offers neither the paperclip nor the box while a message is being changed', async () => {
      mountBar()
      expect(clip().exists()).toBe(true)
      expect(box().exists()).toBe(true)

      await startEditing()

      expect(clip().exists()).toBe(false)
      expect(box().exists()).toBe(false)

      await stopEditing()
      expect(clip().exists()).toBe(true)
      expect(box().exists()).toBe(true)
    })

    it('offers no announcement in a group either', async () => {
      mountBar({ name: 'Gradido-Café Berlin', group: true, canAnnounce: true, announceTo: 4 })
      expect(box().exists()).toBe(true)

      await startEditing()

      expect(box().exists()).toBe(false)
    })

    describe('saving', () => {
      it('hands on the uuid and the text without the space around it -- and sends nothing', async () => {
        mountBar()
        await startEditing()

        await field().setValue('  Der Hofflohmarkt ist am Samstag ab 11 Uhr.  \n')
        expect(button().attributes('aria-disabled')).toBe('false')
        await button().trigger('click')

        expect(saved()).toEqual([
          [{ messageUuid: 'uuid-7', body: 'Der Hofflohmarkt ist am Samstag ab 11 Uhr.' }],
        ])
        expect(sent()).toEqual([])
        expect(letGo()).toEqual([])
        // The field keeps the new text until the thread says the change went through.
        expect(field().element.value).toBe('  Der Hofflohmarkt ist am Samstag ab 11 Uhr.  \n')
      })

      it('saves on Cmd+Enter and on Ctrl+Enter, and not on Enter', async () => {
        mountBar()
        await startEditing()
        await field().setValue('Neu')

        await field().trigger('keydown', { key: 'Enter' })
        expect(saved()).toEqual([])

        await field().trigger('keydown', { key: 'Enter', metaKey: true })
        await field().trigger('keydown', { key: 'Enter', ctrlKey: true })
        expect(saved()).toHaveLength(2)
        expect(sent()).toEqual([])
      })

      // The same words: nothing to change, and nothing to ask the server for.
      it('lets go instead where the words are the same', async () => {
        mountBar()
        await startEditing()

        await button().trigger('click')
        await field().setValue(`  ${MESSAGE.body} \n`)
        await button().trigger('click')

        expect(saved()).toEqual([])
        expect(letGo()).toHaveLength(2)
      })

      it('saves no empty text, and none over the limit', async () => {
        mountBar()
        await startEditing()

        await field().setValue('   \n ')
        expect(button().attributes('aria-disabled')).toBe('true')
        await button().trigger('click')

        await field().setValue('x'.repeat(2001))
        expect(button().attributes('aria-disabled')).toBe('true')
        await button().trigger('click')

        await field().setValue('x'.repeat(2000))
        expect(button().attributes('aria-disabled')).toBe('false')

        expect(saved()).toEqual([])
        expect(letGo()).toEqual([])
      })

      // E-044: with a picture the words are its caption, and may go.
      it('lets the caption of a picture be emptied', async () => {
        mountBar()
        await startEditing(CAPTION)

        await field().setValue('  ')
        expect(button().attributes('aria-disabled')).toBe('false')
        await button().trigger('click')

        expect(saved()).toEqual([[{ messageUuid: 'uuid-9', body: '' }]])
      })

      it('saves no caption over the limit', async () => {
        mountBar()
        await startEditing(CAPTION)

        await field().setValue('x'.repeat(2001))

        expect(button().attributes('aria-disabled')).toBe('true')
      })

      // The bar's own picture does not count: the message's own does.
      it('goes by the message’s picture, not by one waiting in the bar', async () => {
        quietCanvas()
        encoding.openChatImage.mockResolvedValueOnce(READY)
        mountBar()
        await choose()
        expect(attached().exists()).toBe(true)

        await startEditing()
        await field().setValue('')

        expect(button().attributes('aria-disabled')).toBe('true')
      })

      it('waits while the change is on its way', async () => {
        mountBar()
        await startEditing()
        await field().setValue('Neu')

        await wrapper.setProps({ sending: true })
        expect(button().attributes('aria-disabled')).toBe('true')
        await button().trigger('click')
        await field().trigger('keydown', { key: 'Enter', metaKey: true })

        expect(saved()).toEqual([])
      })
    })

    describe('letting go', () => {
      it('lets go by the ✕, which says what it does', async () => {
        mountBar()
        await startEditing()

        expect(cross().attributes('aria-label')).toBe('chatThread.editCancel')
        expect(cross().attributes('type')).toBe('button')
        await cross().trigger('click')

        expect(letGo()).toHaveLength(1)
        expect(saved()).toEqual([])
      })

      /**
       * ⛔ Esc in the field lets the changing go -- and goes no further: the contact window closes
       * on an Esc from anywhere inside it, and would shut over a text half changed.
       */
      it('lets go on Esc in the field, and keeps the Esc to itself', async () => {
        mountBar({}, { attachTo: document.body })
        await startEditing()
        const heardAbove = vi.fn()
        document.body.addEventListener('keydown', heardAbove)
        try {
          await field().trigger('keydown', { key: 'Escape' })
        } finally {
          document.body.removeEventListener('keydown', heardAbove)
        }

        expect(letGo()).toHaveLength(1)
        expect(heardAbove).not.toHaveBeenCalled()
      })

      // Gegenprobe: without a message being changed, Esc goes on to the window as it always did.
      it('lets an Esc go on while no message is being changed', async () => {
        mountBar({}, { attachTo: document.body })
        const heardAbove = vi.fn()
        document.body.addEventListener('keydown', heardAbove)
        try {
          await field().trigger('keydown', { key: 'Escape' })
        } finally {
          document.body.removeEventListener('keydown', heardAbove)
        }

        expect(heardAbove).toHaveBeenCalledTimes(1)
        expect(letGo()).toEqual([])
      })
    })

    /** ⛔ The text in the field is never lost but by sending it. */
    describe('what stood in the bar', () => {
      it('waits, and comes back when the changing ends: the words, the box, the picture', async () => {
        quietCanvas()
        encoding.openChatImage.mockResolvedValueOnce(READY)
        mountBar({}, { attachTo: document.body })
        await field().setValue('Ein angefangener Satz')
        await box().setValue(true)
        await choose()
        expect(attached().exists()).toBe(true)

        await startEditing()
        expect(field().element.value).toBe(MESSAGE.body)
        expect(attached().exists()).toBe(false)
        // What the thread notes for the way back after a restart: the words that wait.
        expect(wrapper.vm.draft()).toBe('Ein angefangener Satz')

        await field().setValue('Halb geändert')
        expect(wrapper.vm.draft()).toBe('Ein angefangener Satz')
        await stopEditing()

        expect(field().element.value).toBe('Ein angefangener Satz')
        expect(box().element.checked).toBe(true)
        expect(attached().exists()).toBe(true)
        expect(strip().exists()).toBe(false)
        expect(document.activeElement).toBe(field().element)
        expect(wrapper.vm.draft()).toBe('Ein angefangener Satz')
      })

      it('comes back empty where the bar was empty', async () => {
        mountBar()
        await startEditing()
        await field().setValue('Halb geändert')

        await stopEditing()

        expect(field().element.value).toBe('')
        expect(box().element.checked).toBe(false)
      })

      // From one message straight to another: the other's text, and what waited goes on waiting.
      it('goes on waiting from one message straight to another', async () => {
        mountBar()
        await field().setValue('Ein angefangener Satz')
        await startEditing()
        await field().setValue('Halb geändert')

        await startEditing(CAPTION)
        expect(field().element.value).toBe('Unser Stand')

        await stopEditing()
        expect(field().element.value).toBe('Ein angefangener Satz')
      })

      /**
       * ⛔ A message sent just before goes through while another is being changed: what went out
       * is cleared from what WAITS. Left there, it would come back into the field once the
       * changing ends -- to be sent a second time.
       */
      it('does not bring back a message that went through meanwhile', async () => {
        mountBar()
        await field().setValue('Hallo Lena')
        await box().setValue(true)
        await button().trigger('click')
        expect(sent()).toHaveLength(1)
        await wrapper.setProps({ sending: true })

        await startEditing()
        await wrapper.setProps({ sending: false })
        await flushPromises()
        // The message being changed is not touched by it.
        expect(field().element.value).toBe(MESSAGE.body)
        expect(wrapper.vm.draft()).toBe('')

        await stopEditing()

        expect(field().element.value).toBe('')
        expect(box().element.checked).toBe(false)
      })

      // Gegenprobe: typed on while it was on its way -- those words are the member's, and wait.
      it('brings back what was typed after the message went out', async () => {
        mountBar()
        await field().setValue('Hallo Lena')
        await button().trigger('click')
        await wrapper.setProps({ sending: true })
        await field().setValue('Hallo Lena\nUnd noch etwas')

        await startEditing()
        await wrapper.setProps({ sending: false })
        await flushPromises()
        await stopEditing()

        expect(field().element.value).toBe('Hallo Lena\nUnd noch etwas')
      })

      // A message that did not go through waits whole -- and its line with it.
      it('brings back a message that did not go through, and its line', async () => {
        mountBar()
        await field().setValue('Hallo Lena')
        await button().trigger('click')
        await wrapper.setProps({ sending: true })

        await startEditing()
        await wrapper.setProps({ sending: false, failed: true })
        await flushPromises()
        // Not under a message being changed: it would read as "the change was not sent".
        expect(failedLine().exists()).toBe(false)

        await stopEditing()

        expect(field().element.value).toBe('Hallo Lena')
        expect(failedLine().text()).toBe('chatThread.notSent')
      })

      // A picture still being opened when the changing began: it waits with the words that wait.
      it('lets a picture that was still being opened wait as well', async () => {
        quietCanvas()
        let opened
        encoding.openChatImage.mockReturnValueOnce(
          new Promise((resolve) => {
            opened = resolve
          }),
        )
        mountBar()
        await choose()

        await startEditing()
        opened(READY)
        await flushPromises()
        expect(attached().exists()).toBe(false)

        await stopEditing()
        expect(attached().exists()).toBe(true)
      })
    })

    describe('a change that did not go through', () => {
      it.each([
        ['NOT_CONFIRMED', 'chatThread.editNotConfirmed {"name":"Lena"}'],
        ['PENDING', 'chatThread.editPending'],
        ['OTHER', 'chatThread.editNotSaved'],
      ])('says why under the field (%s), and keeps the new text', async (editProblem, words) => {
        mountBar()
        await startEditing()
        await field().setValue('Neu')

        await wrapper.setProps({ editProblem })

        expect(problemLine().text()).toBe(words)
        expect(problemLine().attributes('role')).toBe('alert')
        expect(field().element.value).toBe('Neu')
      })

      it('says nothing without a problem, and nothing once the changing ended', async () => {
        mountBar()
        await startEditing()
        expect(problemLine().exists()).toBe(false)

        await wrapper.setProps({ editing: null, editProblem: 'OTHER' })
        await flushPromises()

        expect(problemLine().exists()).toBe(false)
      })
    })

    // "Bearbeiten" pressed once more at the message that is being changed (ChatThread).
    it('takes the keyboard into the field when asked to', async () => {
      const elsewhere = document.createElement('button')
      document.body.appendChild(elsewhere)
      mountBar({}, { attachTo: document.body })
      await startEditing()
      elsewhere.focus()

      wrapper.vm.focus()

      expect(document.activeElement).toBe(field().element)
    })
  })

  describe('the paperclip and its hint', () => {
    const clip = () => wrapper.find('[data-test="chat-compose-attach"]')
    const hint = () => wrapper.find('[data-test="chat-compose-file-hint"]')
    const openLink = () => wrapper.find('[data-test="chat-compose-file-open"]')

    /** The paperclip's menu, then "Datei" (E-044, F1: with the pictures it is a menu). */
    const chooseFileEntry = async () => {
      await clip().trigger('click')
      await wrapper.find('[data-test="chat-compose-file"]').trigger('click')
    }

    const openHint = async (props = {}, options = {}) => {
      mountBar(props, options)
      await chooseFileEntry()
      return hint()
    }

    // A sign without a word (the learnt exception to E-033), so its name is what a screen reader
    // and a hovering mouse get -- and it stands first in the row, before the field.
    it('stands before the field, as a button with its name', () => {
      mountBar()

      const row = wrapper.find('.chat-compose-row').element
      expect(row.firstElementChild.firstElementChild).toBe(clip().element)
      expect(
        clip().element.compareDocumentPosition(field().element) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(clip().element.tagName).toBe('BUTTON')
      expect(clip().attributes('type')).toBe('button')
      expect(clip().attributes('aria-label')).toBe('chatThread.attach')
      expect(clip().attributes('title')).toBe('chatThread.attach')
    })

    // A link is an ordinary message: there is no reason to leave it out of the first one.
    it('is there with the first message of a conversation too', () => {
      mountBar({ first: true })
      expect(clip().exists()).toBe(true)
      expect(wrapper.find('[data-test="chat-compose-first"]').exists()).toBe(true)
    })

    // E-044, F1: with the pictures the paperclip is a menu, and "Datei" opens the hint.
    it('opens the hint from the menu, named as the title it has instead of a header', async () => {
      mountBar()
      expect(hint().exists()).toBe(false)

      await chooseFileEntry()

      expect(hint().exists()).toBe(true)
      expect(hint().attributes('aria-label')).toBe('chatThread.fileTitle')
      expect(wrapper.find('[data-test="chat-compose-file-title"]').text()).toBe(
        'chatThread.fileTitle',
      )
      // The surface under the paperclip while its hint is open.
      expect(clip().classes()).toContain('is-open')
    })

    it('says that Gradido stores no files, and the three steps in their order', async () => {
      const shown = await openHint()

      expect(shown.text()).toContain('chatThread.fileIntro')
      const steps = wrapper.findAll('[data-test="chat-compose-file-steps"] > li')
      expect(steps.map((step) => step.text())).toEqual([
        'chatThread.fileStep1',
        'chatThread.fileStep2',
        'chatThread.fileStep3',
      ])
      expect(wrapper.find('[data-test="chat-compose-file-steps"]').element.tagName).toBe('OL')
      const about = wrapper.find('[data-test="chat-compose-file-about"]')
      expect(about.text()).toBe('chatThread.fileAbout')
      expect(about.classes()).toEqual(expect.arrayContaining(['small', 'text-muted']))
    })

    /**
     * ⛔ A link, not a button: SwissTransfer's front page in a tab of its own, and no address
     * of the opener goes with it. Without a language -- the page picks the browser's.
     */
    it('leads to SwissTransfer with a link that opens a tab of its own', async () => {
      await openHint()

      const link = openLink()
      expect(link.element.tagName).toBe('A')
      expect(link.attributes('href')).toBe(SWISSTRANSFER_URL)
      expect(link.attributes('href')).toBe('https://www.swisstransfer.com/')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      expect(link.classes()).toEqual(expect.arrayContaining(['btn', 'btn-md', 'btn-gradido']))
      expect(link.text()).toBe('chatThread.fileOpen')
    })

    it('closes with "Close"', async () => {
      await openHint()

      await wrapper.find('[data-test="chat-compose-file-close"]').trigger('click')

      expect(hint().exists()).toBe(false)
      expect(clip().classes()).not.toContain('is-open')
    })

    /**
     * The link closes the hint as it opens SwissTransfer -- and lets the link go on: whoever
     * comes back finds the field for the link. What the page does with the click is read at the
     * document, after the link's own handler; the document then keeps jsdom from navigating.
     */
    it('closes as the link opens SwissTransfer, without holding the link up', async () => {
      await openHint({}, { attachTo: document.body })
      let prevented = null
      const onClick = (event) => {
        prevented = event.defaultPrevented
        event.preventDefault()
      }
      document.addEventListener('click', onClick)
      try {
        const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
        openLink().element.dispatchEvent(click)
        await flushPromises()
      } finally {
        document.removeEventListener('click', onClick)
      }

      expect(prevented).toBe(false)
      expect(hint().exists()).toBe(false)
    })

    // At a computer the tip to SwissTransfer's app for phones is a sentence too many.
    it('leaves out the tip to the app on a computer', async () => {
      await openHint()
      expect(wrapper.find('[data-test="chat-compose-file-tip"]').exists()).toBe(false)
    })

    it('gives the tip to the app on a phone', async () => {
      vi.mocked(isComputer).mockReturnValue(false)
      await openHint()

      const tip = wrapper.find('[data-test="chat-compose-file-tip"]')
      expect(tip.exists()).toBe(true)
      expect(tip.text()).toBe('chatThread.fileAppTip')
    })

    /**
     * Asked when the hint opens, nothing kept: the next opening asks again. (The menu the hint is
     * chosen from asks as well, for its camera: two questions each time.)
     */
    it('asks whether this is a computer each time the hint opens', async () => {
      await openHint()
      expect(isComputer).toHaveBeenCalledTimes(2)
      await wrapper.find('[data-test="chat-compose-file-close"]').trigger('click')

      vi.mocked(isComputer).mockReturnValue(false)
      await chooseFileEntry()

      expect(isComputer).toHaveBeenCalledTimes(4)
      expect(wrapper.find('[data-test="chat-compose-file-tip"]').exists()).toBe(true)
    })

    // The paperclip sends nothing and takes nothing away: the text and the box stay.
    it('leaves the field and the box as they are', async () => {
      mountBar()
      await field().setValue('Hier ist die Datei:')
      await box().setValue(true)

      await chooseFileEntry()
      await wrapper.find('[data-test="chat-compose-file-close"]').trigger('click')

      expect(sent()).toEqual([])
      expect(field().element.value).toBe('Hier ist die Datei:')
      expect(box().element.checked).toBe(true)
      await button().trigger('click')
      expect(sent()).toEqual([[{ body: 'Hier ist die Datei:', notify: 'EMAIL', image: null }]])
    })
  })

  /**
   * P7 (E-044, F1): the paperclip opens a small menu, "Bild" and "Datei". A disclosure -- the
   * picture's entry is a file field, which may not be a menu item -- that closes on a choice, on
   * Esc and on a press elsewhere.
   */
  describe('the paperclip’s menu', () => {
    const clip = () => wrapper.find('[data-test="chat-compose-attach"]')
    const menu = () => wrapper.find('[data-test="chat-compose-menu"]')
    const picker = () => wrapper.find('[data-test="chat-compose-picker"]')
    const pictureEntry = () => wrapper.find('[data-test="chat-compose-picture"]')
    const fileEntry = () => wrapper.find('[data-test="chat-compose-file"]')
    const cameraEntry = () => wrapper.find('[data-test="chat-compose-camera"]')
    const cameraField = () => wrapper.find('[data-test="chat-compose-camera-field"]')
    const isOpen = () => menu().classes().includes('is-open')

    const openMenu = async (props = {}) => {
      mountBar(props, { attachTo: document.body })
      await clip().trigger('click')
      await flushPromises()
    }

    it('says whether it is open, and which entries it opens', async () => {
      mountBar()
      expect(clip().attributes('aria-expanded')).toBe('false')
      expect(clip().attributes('aria-controls')).toBe(menu().attributes('id'))
      // A disclosure, not an ARIA menu: nothing announces keys a menu would have.
      expect(clip().attributes('aria-haspopup')).toBeUndefined()
      expect(isOpen()).toBe(false)

      await clip().trigger('click')

      expect(clip().attributes('aria-expanded')).toBe('true')
      expect(isOpen()).toBe(true)
      expect(clip().classes()).toContain('is-open')
      expect(menu().attributes('role')).toBe('group')
      expect(menu().attributes('aria-label')).toBe('chatThread.attach')
    })

    it('offers "Bild" and "Datei", each with its word and the line under it', async () => {
      mountBar()
      await clip().trigger('click')

      const words = (entry) =>
        [entry.find('.chat-compose-menu-label'), entry.find('.chat-compose-menu-hint')].map((w) =>
          w.text(),
        )
      expect(words(pictureEntry())).toEqual([
        'chatThread.attachImage',
        'chatThread.attachImageHint',
      ])
      expect(words(fileEntry())).toEqual(['chatThread.attachFile', 'chatThread.attachFileHint'])
      // Picture first, then file, as in the mockup.
      expect(
        pictureEntry().element.compareDocumentPosition(fileEntry().element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(fileEntry().element.tagName).toBe('BUTTON')
      expect(fileEntry().attributes('type')).toBe('button')
    })

    /**
     * ⛔ FOTO-04: a label for a field hidden only from the eye -- never `display: none`, never a
     * script's click. Pictures only, and no `capture` on "Bild": the camera has its own entry.
     */
    it('opens the device’s picker through a label, for pictures, without capture', () => {
      mountBar()

      expect(pictureEntry().element.tagName).toBe('LABEL')
      expect(pictureEntry().attributes('for')).toBe(picker().attributes('id'))
      expect(picker().attributes('type')).toBe('file')
      expect(picker().attributes('accept')).toBe('image/*')
      expect(picker().attributes('capture')).toBeUndefined()
      expect(picker().classes()).toContain('visually-hidden')
      expect(picker().attributes('hidden')).toBeUndefined()
      expect(picker().attributes('style') ?? '').not.toMatch(/display/)
      // …and the label right after its field, so the label can show the field's focus.
      expect(picker().element.nextElementSibling).toBe(pictureEntry().element)
    })

    /**
     * E-047: "Foto aufnehmen" first, on a phone or a tablet -- a field with `capture`, which their
     * camera app answers, the back camera first; hidden only from the eye and opened by its label,
     * like "Bild".
     */
    it('offers the camera first on a phone or a tablet', async () => {
      vi.mocked(isComputer).mockReturnValue(false)
      mountBar()
      await clip().trigger('click')

      const words = [
        cameraEntry().find('.chat-compose-menu-label'),
        cameraEntry().find('.chat-compose-menu-hint'),
      ].map((w) => w.text())
      expect(words).toEqual(['chatThread.attachCamera', 'chatThread.attachCameraHint'])
      expect(cameraEntry().element.tagName).toBe('LABEL')
      expect(cameraEntry().attributes('for')).toBe(cameraField().attributes('id'))
      expect(cameraField().attributes('type')).toBe('file')
      expect(cameraField().attributes('accept')).toBe('image/*')
      expect(cameraField().attributes('capture')).toBe('environment')
      expect(cameraField().classes()).toContain('visually-hidden')
      expect(cameraField().attributes('style') ?? '').not.toMatch(/display/)
      expect(cameraField().element.nextElementSibling).toBe(cameraEntry().element)
      // Its own field and its own name, not "Bild"'s.
      expect(cameraField().attributes('id')).not.toBe(picker().attributes('id'))
      // First, before "Bild".
      expect(
        cameraEntry().element.compareDocumentPosition(pictureEntry().element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    // ⛔ Bernd, 29.09.2026: "Es ist nur wichtig, dass im Computer dann keine Kamera-Option zu sehen ist."
    it('offers no camera on a computer, not even hidden', async () => {
      vi.mocked(isComputer).mockReturnValue(true)
      mountBar()
      await clip().trigger('click')

      expect(cameraEntry().exists()).toBe(false)
      expect(cameraField().exists()).toBe(false)
      expect(wrapper.findAll('input[capture]')).toHaveLength(0)
      expect(pictureEntry().exists()).toBe(true)
    })

    // Asked when the menu opens: before that, nothing is known and nothing is offered.
    it('asks whether this is a computer when the menu opens', async () => {
      vi.mocked(isComputer).mockReturnValue(false)
      mountBar()
      expect(isComputer).not.toHaveBeenCalled()

      await clip().trigger('click')

      expect(isComputer).toHaveBeenCalledTimes(1)
      expect(cameraEntry().exists()).toBe(true)
    })

    // The focus goes into the first entry: the camera where there is one.
    it('takes the focus to the camera where it offers one', async () => {
      vi.mocked(isComputer).mockReturnValue(false)
      await openMenu()

      expect(document.activeElement).toBe(cameraField().element)
    })

    /**
     * ⛔ The camera's field stays in the page when the menu closes: the camera app answers after the
     * menu is gone, and a field that is gone would never hear the photo.
     */
    it('keeps the camera’s field when it closes, and takes the photo as a picture', async () => {
      vi.mocked(isComputer).mockReturnValue(false)
      await openMenu()
      await cameraField().trigger('click')
      await new Promise((resolve) => setTimeout(resolve))
      await flushPromises()
      expect(isOpen()).toBe(false)
      expect(document.activeElement).toBe(clip().element)

      const photo = new File(['JPEG'], 'image.jpg', { type: 'image/jpeg' })
      Object.defineProperty(cameraField().element, 'files', { value: [photo], configurable: true })
      encoding.openChatImage.mockResolvedValueOnce({ image: {}, width: 4032, height: 3024 })
      await cameraField().trigger('change')
      await flushPromises()

      expect(encoding.openChatImage).toHaveBeenCalledWith(photo)
      expect(wrapper.find('[data-test="chat-compose-attached"]').exists()).toBe(true)
    })

    // ⛔ Rendered while closed: the field must still be there when the picker answers.
    it('keeps its entries in the page while it is closed', () => {
      mountBar()
      expect(isOpen()).toBe(false)
      expect(picker().exists()).toBe(true)
      expect(fileEntry().exists()).toBe(true)
    })

    it('takes the focus in when it opens', async () => {
      await openMenu()
      expect(document.activeElement).toBe(picker().element)
    })

    it('closes with the paperclip again, the focus on the paperclip', async () => {
      await openMenu()

      await clip().trigger('click')

      expect(isOpen()).toBe(false)
      expect(document.activeElement).toBe(clip().element)
    })

    /**
     * Esc closes the menu, hands the focus back -- and goes no further: the contact window closes
     * on an Esc from anywhere inside it.
     */
    it('closes on Esc, the focus back on the paperclip, and keeps the Esc to itself', async () => {
      await openMenu()
      const heardAbove = vi.fn()
      document.body.addEventListener('keydown', heardAbove)
      try {
        await picker().trigger('keydown', { key: 'Escape' })
      } finally {
        document.body.removeEventListener('keydown', heardAbove)
      }

      expect(isOpen()).toBe(false)
      expect(document.activeElement).toBe(clip().element)
      expect(heardAbove).not.toHaveBeenCalled()
    })

    // Gegenprobe: with the menu shut, Esc goes on to the window as it always did.
    it('lets an Esc go on while it is closed', async () => {
      mountBar({}, { attachTo: document.body })
      const heardAbove = vi.fn()
      document.body.addEventListener('keydown', heardAbove)
      try {
        await clip().trigger('keydown', { key: 'Escape' })
      } finally {
        document.body.removeEventListener('keydown', heardAbove)
      }

      expect(heardAbove).toHaveBeenCalledTimes(1)
    })

    /**
     * The press alone, with the focus left where it is: a press on something that takes no focus
     * -- a line of the thread -- does not move it, and on some devices none does. (Where the focus
     * does leave the menu, the rule below closes it too; this one must not lean on that.)
     */
    it('closes on a press elsewhere, and does not take the focus anywhere', async () => {
      await openMenu()
      const elsewhere = document.createElement('p')
      document.body.appendChild(elsewhere)
      const focusedBefore = document.activeElement

      elsewhere.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      await flushPromises()

      expect(isOpen()).toBe(false)
      expect(document.activeElement).toBe(focusedBefore)
      expect(document.activeElement).not.toBe(clip().element)
    })

    // A press on the menu itself is not "elsewhere".
    it('stays open on a press inside it', async () => {
      await openMenu()

      fileEntry().element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      await flushPromises()

      expect(isOpen()).toBe(true)
    })

    it('closes behind the focus when Tab leaves it', async () => {
      await openMenu()

      await fileEntry().trigger('focusout', { relatedTarget: field().element })

      expect(isOpen()).toBe(false)
      // …and Tab within it keeps it open.
      await clip().trigger('click')
      await flushPromises()
      await picker().trigger('focusout', { relatedTarget: fileEntry().element })
      expect(isOpen()).toBe(true)
    })

    /**
     * ⛔ A mouse press on "Bild", as Chrome makes it (measured, P7c): the label takes no focus, so
     * the press hands it to the nearest ancestor that does -- the contact window. The menu has to
     * stay open through that, or the label is hidden before the button comes up and the click that
     * opens the picker never comes.
     */
    it('stays open when a press on "Bild" hands the focus to what holds the menu', async () => {
      await openMenu()
      const holder = wrapper.element
      holder.tabIndex = -1
      const pressed = vi.fn()
      picker().element.addEventListener('click', pressed)

      pictureEntry().element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      holder.focus()
      await flushPromises()

      expect(document.activeElement).toBe(holder)
      expect(isOpen()).toBe(true)
      await pictureEntry().trigger('click')
      expect(pressed).toHaveBeenCalledTimes(1)
    })

    // The same where the focus goes nowhere -- the window loses it, or nothing holds the menu.
    it('stays open when the focus goes nowhere', async () => {
      await openMenu()

      await picker().trigger('focusout', { relatedTarget: null })

      expect(isOpen()).toBe(true)
    })

    /**
     * "Bild": the label hands the press to the field, which opens the picker -- and the menu
     * closes a moment after, in a task of its own, so the field is still in a shown menu when the
     * picker opens. Then the focus is back on the paperclip.
     */
    it('closes after "Bild" is chosen, a task later, the focus back on the paperclip', async () => {
      await openMenu()
      const pressed = vi.fn()
      picker().element.addEventListener('click', pressed)

      await pictureEntry().trigger('click')

      expect(pressed).toHaveBeenCalledTimes(1)
      expect(isOpen()).toBe(true)
      await new Promise((resolve) => setTimeout(resolve))
      await flushPromises()
      expect(isOpen()).toBe(false)
      expect(document.activeElement).toBe(clip().element)
    })

    // The same with a key on the field: the field hears its own click.
    it('closes the same way when "Bild" is chosen with a key', async () => {
      await openMenu()

      await picker().trigger('click')
      await new Promise((resolve) => setTimeout(resolve))
      await flushPromises()

      expect(isOpen()).toBe(false)
      expect(document.activeElement).toBe(clip().element)
    })

    /**
     * "Datei": the menu closes, the focus goes to the paperclip -- the hint hands the focus back,
     * when it closes, to what had it when it opened -- and the hint opens as before.
     */
    it('opens the hint with "Datei", the focus on the paperclip first', async () => {
      await openMenu()
      let focusedWhenHintOpened = null
      fileEntry().element.addEventListener('click', () => {
        queueMicrotask(() => (focusedWhenHintOpened = document.activeElement))
      })

      await fileEntry().trigger('click')

      expect(isOpen()).toBe(false)
      expect(wrapper.find('[data-test="chat-compose-file-hint"]').exists()).toBe(true)
      expect(focusedWhenHintOpened).toBe(clip().element)
    })

    it('stops listening for presses elsewhere once it is gone', async () => {
      await openMenu()
      const removed = vi.spyOn(document, 'removeEventListener')

      wrapper.unmount()

      expect(removed).toHaveBeenCalledWith('pointerdown', expect.any(Function), true)
      removed.mockRestore()
      wrapper = null
    })
  })

  /**
   * P7: the picture chosen goes with the next message. While it is opened the bar says so; then it
   * shows the picture over the field, and the words become its caption. Since E-047 it stays whole
   * until the message is sent, and only then is it made small.
   */
  describe('the picture that goes with a message', () => {
    /** Pictures as openChatImage hands them on: the decoded one and its size. */
    const READY = { image: { name: 'ready' }, width: 4000, height: 3000 }
    const OTHER = { image: { name: 'other' }, width: 3000, height: 4000 }
    /** What encodeChatImage makes of one when it is sent: the JPEG and its size. */
    const JPEG = { data: 'SlBFRw==', width: 800, height: 600, bytes: 20000 }

    const attached = () => wrapper.find('[data-test="chat-compose-attached"]')
    const preview = () => wrapper.find('[data-test="chat-compose-attached-picture"]')
    const words = () => wrapper.find('[data-test="chat-compose-attached-words"]')
    const remove = () => wrapper.find('[data-test="chat-compose-attached-remove"]')
    const problem = () => wrapper.find('[data-test="chat-compose-picture-problem"]')
    const status = () => wrapper.find('[data-test="chat-compose-picture-status"]')
    const clip = () => wrapper.find('[data-test="chat-compose-attach"]')

    /**
     * jsdom has no 2D context: each canvas gets a recording one, and remembers what was drawn on it
     * last -- so a test can ask which picture the preview shows, and how it was placed.
     */
    const recordDrawing = () =>
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
        const canvas = this
        canvas.steps = []
        const record =
          (name) =>
          (...args) =>
            canvas.steps.push([name, ...args])
        return {
          save: record('save'),
          restore: record('restore'),
          translate: record('translate'),
          scale: record('scale'),
          rotate: record('rotate'),
          drawImage: (image, ...args) => {
            canvas.shown = image
            canvas.steps.push(['drawImage', image, ...args])
          },
        }
      })
    const shown = () => preview().element.shown

    // Every picture test draws: jsdom's canvas would only complain that it cannot.
    beforeEach(() => {
      recordDrawing()
    })

    // The two frames the bar waits before it makes a picture small pass at once here.
    const framesPassAtOnce = () =>
      vi.stubGlobal('requestAnimationFrame', (callback) => {
        callback()
        return 0
      })

    /** A promise a test settles when it wants: the picture still being opened till then. */
    const deferred = () => {
      const settle = {}
      const promise = new Promise((resolve, reject) => Object.assign(settle, { resolve, reject }))
      return { promise, ...settle }
    }

    /** What the device's picker answers with: a file on the field, and its change. */
    const choose = async (file = new File(['JPEG'], 'photo.jpg', { type: 'image/jpeg' })) => {
      const picker = wrapper.find('[data-test="chat-compose-picker"]')
      Object.defineProperty(picker.element, 'files', { value: [file], configurable: true })
      await picker.trigger('change')
      await flushPromises()
      return file
    }

    const chooseReady = async (ready = READY) => {
      encoding.openChatImage.mockResolvedValueOnce(ready)
      await choose()
    }

    /** The send button pressed with a picture: made small, as the test says. */
    const sendWith = async (jpeg = JPEG) => {
      encoding.encodeChatImage.mockResolvedValueOnce(jpeg)
      await button().trigger('click')
      await flushPromises()
    }

    it('says the picture is being opened, then shows it', async () => {
      mountBar()
      const pending = deferred()
      encoding.openChatImage.mockReturnValueOnce(pending.promise)
      const file = await choose()

      expect(encoding.openChatImage).toHaveBeenCalledWith(file)
      expect(attached().exists()).toBe(true)
      expect(words().text()).toBe('chatThread.imagePreparing')
      expect(wrapper.find('.chat-compose-attached-wait').exists()).toBe(true)
      expect(preview().exists()).toBe(false)
      expect(remove().exists()).toBe(false)

      pending.resolve(READY)
      await flushPromises()

      expect(preview().element.tagName).toBe('CANVAS')
      expect(preview().attributes('aria-hidden')).toBe('true')
      expect(shown()).toBe(READY.image)
      expect(words().text()).toBe('chatThread.imageReady chatThread.imageReadyHint')
      expect(words().find('small').text()).toBe('chatThread.imageReadyHint')
      expect(remove().attributes('aria-label')).toBe('chatThread.imageRemove')
      expect(remove().attributes('title')).toBe('chatThread.imageRemove')
      expect(remove().attributes('type')).toBe('button')
    })

    /**
     * ⛔ Kept whole until the message is sent (E-047, point 6): choosing opens the picture, it does
     * not make it small -- the editor and "Sichern" need it in full quality.
     */
    it('makes the picture small only when the message is sent', async () => {
      framesPassAtOnce()
      mountBar()
      await chooseReady()
      expect(encoding.encodeChatImage).not.toHaveBeenCalled()

      await sendWith()

      expect(encoding.encodeChatImage).toHaveBeenCalledTimes(1)
      expect(encoding.encodeChatImage).toHaveBeenCalledWith(READY, CHAT_IMAGE_UNEDITED)
    })

    /**
     * The preview is drawn from the picture as chosen, the cutout filling its square from the middle
     * -- the same drawing the editor and the picture sent use.
     */
    it('draws the preview from the picture, filling the square', async () => {
      mountBar()
      await chooseReady()

      const canvas = preview().element
      expect([canvas.width, canvas.height]).toEqual([56, 56])
      const steps = canvas.steps
      expect(steps[1]).toEqual(['translate', 28, 28])
      // 4000 x 3000 into 56 x 56: the height fills it, the sides run over
      expect(steps[2][1]).toBeCloseTo(56 / 3000, 6)
      expect(steps[2][2]).toBeCloseTo(56 / 3000, 6)
      expect(steps.find((step) => step[0] === 'drawImage')).toEqual([
        'drawImage',
        READY.image,
        -2000,
        -1500,
        4000,
        3000,
      ])
    })

    // E-044: with a picture the words are its caption, and optional.
    it('makes the field the caption, while the picture is opened and after', async () => {
      mountBar()
      expect(field().attributes('placeholder')).toBe('chatThread.placeholder {"name":"Lena"}')
      const pending = deferred()
      encoding.openChatImage.mockReturnValueOnce(pending.promise)
      await choose()
      expect(field().attributes('placeholder')).toBe('chatThread.imageCaption')

      pending.resolve(READY)
      await flushPromises()
      expect(field().attributes('placeholder')).toBe('chatThread.imageCaption')
      // …and its hidden label says the same.
      expect(wrapper.find(`label[for="${field().attributes('id')}"]`).text()).toBe(
        'chatThread.imageCaption',
      )
    })

    it('sends a picture with an empty text', async () => {
      framesPassAtOnce()
      mountBar()
      await chooseReady()
      expect(button().attributes('aria-disabled')).toBe('false')

      await sendWith()

      // The picture as the server takes it: the JPEG and its size -- not the picture, not the bytes.
      expect(sent()).toEqual([
        [{ body: '', notify: 'NONE', image: { data: 'SlBFRw==', width: 800, height: 600 } }],
      ])
    })

    it('sends the words as the caption, the space around them left off', async () => {
      framesPassAtOnce()
      mountBar()
      await chooseReady()
      await field().setValue('  Unser Stand  ')

      await sendWith()

      expect(sent()).toEqual([
        [
          {
            body: 'Unser Stand',
            notify: 'NONE',
            image: { data: 'SlBFRw==', width: 800, height: 600 },
          },
        ],
      ])
    })

    // Chosen for this message: nothing goes before it is open -- not even the words.
    it('waits while the picture is being opened', async () => {
      mountBar()
      encoding.openChatImage.mockReturnValueOnce(deferred().promise)
      await field().setValue('Hallo')
      await choose()

      expect(button().attributes('aria-disabled')).toBe('true')
      await button().trigger('click')
      await field().trigger('keydown', { key: 'Enter', metaKey: true })
      expect(sent()).toEqual([])
    })

    /**
     * Made small when it is sent, the bar says so meanwhile -- and a second press does not send it
     * twice. What was pressed is what goes, words included.
     */
    it('says the picture is being prepared while it is made small, and sends it once', async () => {
      framesPassAtOnce()
      mountBar()
      await chooseReady()
      await field().setValue('Unser Stand')
      const pending = deferred()
      encoding.encodeChatImage.mockReturnValueOnce(pending.promise)

      await button().trigger('click')
      await flushPromises()
      expect(words().text()).toBe('chatThread.imagePreparing')
      expect(status().text()).toBe('chatThread.imagePreparing')
      expect(button().attributes('aria-disabled')).toBe('true')
      await button().trigger('click')
      await field().trigger('keydown', { key: 'Enter', metaKey: true })

      pending.resolve(JPEG)
      await flushPromises()
      expect(sent()).toHaveLength(1)
      expect(sent()[0][0]).toMatchObject({ body: 'Unser Stand' })
      expect(encoding.encodeChatImage).toHaveBeenCalledTimes(1)
    })

    /**
     * Making a picture small holds the page for a moment: the bar lets two frames pass first, so
     * that "Bild wird vorbereitet …" is on the screen before it.
     */
    it('lets the words be painted before it makes the picture small', async () => {
      // the bar's bound on the wait stands still here: only the frames move on
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const frames = []
      vi.stubGlobal('requestAnimationFrame', (callback) => frames.push(callback))
      mountBar()
      await chooseReady()
      encoding.encodeChatImage.mockResolvedValueOnce(JPEG)

      await button().trigger('click')
      await flushPromises()
      expect(words().text()).toBe('chatThread.imagePreparing')
      expect(encoding.encodeChatImage).not.toHaveBeenCalled()

      frames.shift()()
      await flushPromises()
      expect(encoding.encodeChatImage).not.toHaveBeenCalled()
      frames.shift()()
      await flushPromises()
      expect(encoding.encodeChatImage).toHaveBeenCalledTimes(1)
      expect(sent()).toHaveLength(1)
    })

    /**
     * A page in the background draws no frames. The bar waits for them a moment only, and the
     * message goes all the same (coderabbit, PR #4010).
     */
    it('sends all the same where no frame comes', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      vi.stubGlobal('requestAnimationFrame', () => 0)
      mountBar()
      await chooseReady()
      encoding.encodeChatImage.mockResolvedValueOnce(JPEG)

      await button().trigger('click')
      await flushPromises()
      vi.advanceTimersByTime(199)
      await flushPromises()
      expect(encoding.encodeChatImage).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      await flushPromises()
      expect(encoding.encodeChatImage).toHaveBeenCalledTimes(1)
      expect(sent()).toHaveLength(1)
    })

    /**
     * Where the picture cannot be made small enough when it is sent, the bar says so and keeps the
     * picture and the words: nothing went.
     */
    it('says so where the picture cannot be made small enough, and keeps it and the words', async () => {
      framesPassAtOnce()
      mountBar()
      await chooseReady()
      await field().setValue('Unser Stand')
      encoding.encodeChatImage.mockRejectedValueOnce(
        Object.assign(new Error('refused'), { problem: 'NOT_SMALL_ENOUGH' }),
      )

      await button().trigger('click')
      await flushPromises()

      expect(sent()).toEqual([])
      expect(problem().text()).toBe('chatThread.imageTooBig')
      expect(problem().attributes('role')).toBe('alert')
      expect(shown()).toBe(READY.image)
      expect(field().element.value).toBe('Unser Stand')
      expect(button().attributes('aria-disabled')).toBe('false')
    })

    // One picture a message: a second one takes the first one's place.
    it('takes a second picture in place of the first', async () => {
      framesPassAtOnce()
      mountBar()
      await chooseReady(READY)
      await chooseReady(OTHER)

      expect(wrapper.findAll('[data-test="chat-compose-attached-picture"]')).toHaveLength(1)
      expect(shown()).toBe(OTHER.image)
      await sendWith({ data: 'T1RIRVI=', width: 600, height: 800, bytes: 18000 })
      expect(encoding.encodeChatImage.mock.calls[0][0]).toBe(OTHER)
      expect(sent()[0][0].image).toEqual({ data: 'T1RIRVI=', width: 600, height: 800 })
    })

    // The last one chosen counts, whichever is open first.
    it('lets a picture go that was overtaken by one chosen after it', async () => {
      mountBar()
      const first = deferred()
      const second = deferred()
      encoding.openChatImage.mockReturnValueOnce(first.promise)
      await choose()
      encoding.openChatImage.mockReturnValueOnce(second.promise)
      await choose()

      second.resolve(OTHER)
      await flushPromises()
      first.resolve(READY)
      await flushPromises()

      expect(shown()).toBe(OTHER.image)
      expect(words().text()).toBe('chatThread.imageReady chatThread.imageReadyHint')
      // …nor does the earlier one's refusal speak for the later.
      const third = deferred()
      const fourth = deferred()
      encoding.openChatImage.mockReturnValueOnce(third.promise)
      await choose()
      encoding.openChatImage.mockReturnValueOnce(fourth.promise)
      await choose()
      third.reject(Object.assign(new Error('x'), { problem: 'HEIC' }))
      await flushPromises()
      expect(problem().exists()).toBe(false)
      expect(words().text()).toBe('chatThread.imagePreparing')
      fourth.resolve(READY)
      await flushPromises()
      expect(shown()).toBe(READY.image)
    })

    /** E-047: the pencil opens the editor -- a choice beside the picture, never a step on the way. */
    describe('the editor', () => {
      const editor = () => wrapper.findComponent({ name: 'ChatImageEditor' })
      const pencil = () => wrapper.find('[data-test="chat-compose-attached-edit"]')

      it('offers to edit the picture with a pencil, once it is open', async () => {
        mountBar()
        const pending = deferred()
        encoding.openChatImage.mockReturnValueOnce(pending.promise)
        await choose()
        expect(pencil().exists()).toBe(false)

        pending.resolve(READY)
        await flushPromises()

        expect(pencil().element.tagName).toBe('BUTTON')
        expect(pencil().attributes('type')).toBe('button')
        expect(pencil().attributes('aria-label')).toBe('chatThread.imageEdit')
        expect(pencil().attributes('title')).toBe('chatThread.imageEdit')
        expect(editor().props('modelValue')).toBe(false)
      })

      it('opens the editor with the picture and what was done to it', async () => {
        mountBar()
        await chooseReady()

        await pencil().trigger('click')

        expect(editor().props('modelValue')).toBe(true)
        expect(editor().props('source')).toBe(READY)
        expect(editor().props('edit')).toEqual(CHAT_IMAGE_UNEDITED)
      })

      // A press on the picture itself opens it too; the pencil is the one the keyboard reaches.
      it('opens it with a press on the picture as well', async () => {
        mountBar()
        await chooseReady()

        await preview().trigger('click')

        expect(editor().props('modelValue')).toBe(true)
        expect(preview().attributes('tabindex')).toBeUndefined()
      })

      /** "Fertig": the preview shows what was done, and the message sends it. */
      it('shows and sends what the editor hands back', async () => {
        framesPassAtOnce()
        mountBar()
        await chooseReady()
        await pencil().trigger('click')
        const turned = { ...CHAT_IMAGE_UNEDITED, turn: 90, shape: 'square' }

        editor().vm.$emit('done', turned)
        editor().vm.$emit('update:modelValue', false)
        await flushPromises()

        expect(editor().props('modelValue')).toBe(false)
        expect(preview().element.steps).toContainEqual(['rotate', Math.PI / 2])
        await pencil().trigger('click')
        expect(editor().props('edit')).toEqual(turned)
        await editor().vm.$emit('update:modelValue', false)

        await sendWith()
        expect(encoding.encodeChatImage).toHaveBeenCalledWith(READY, turned)
      })

      // "Abbrechen" or Esc: the picture stays as it was.
      it('keeps the picture as it was where the editor closes without "Fertig"', async () => {
        framesPassAtOnce()
        mountBar()
        await chooseReady()
        await pencil().trigger('click')

        editor().vm.$emit('update:modelValue', false)
        await flushPromises()
        await sendWith()

        expect(editor().props('modelValue')).toBe(false)
        expect(encoding.encodeChatImage).toHaveBeenCalledWith(READY, CHAT_IMAGE_UNEDITED)
      })

      // A second picture starts unedited: what was done belonged to the first.
      it('starts a second picture unedited', async () => {
        mountBar()
        await chooseReady()
        editor().vm.$emit('done', { ...CHAT_IMAGE_UNEDITED, turn: 180 })
        await flushPromises()

        await chooseReady(OTHER)
        await pencil().trigger('click')

        expect(editor().props('source')).toBe(OTHER)
        expect(editor().props('edit')).toEqual(CHAT_IMAGE_UNEDITED)
      })
    })

    // Emptied after every choice: the same file chosen again is a change again.
    it('lets the same file be chosen again', async () => {
      mountBar()
      const picker = wrapper.find('[data-test="chat-compose-picker"]').element
      let emptied = null
      Object.defineProperty(picker, 'value', {
        configurable: true,
        get: () => '',
        set: (value) => (emptied = value),
      })
      await chooseReady()

      expect(emptied).toBe('')
    })

    it('takes the picture off with its button, and gives the focus to the paperclip', async () => {
      mountBar({}, { attachTo: document.body })
      await chooseReady()

      await remove().trigger('click')

      expect(attached().exists()).toBe(false)
      expect(document.activeElement).toBe(clip().element)
      expect(field().attributes('placeholder')).toBe('chatThread.placeholder {"name":"Lena"}')
      // Without the picture, an empty field sends nothing again.
      expect(button().attributes('aria-disabled')).toBe('true')
    })

    /** Why a picture could not be opened, in the bar's own words, as an alert. */
    it('says why a picture could not be opened', async () => {
      const said = {}
      for (const reason of ['SOURCE_TOO_LARGE', 'HEIC', 'FORMAT', undefined]) {
        mountBar()
        encoding.openChatImage.mockRejectedValueOnce(
          Object.assign(new Error('refused'), { problem: reason }),
        )
        await choose()
        said[reason ?? 'unknown'] = problem().text()
        expect(problem().attributes('role')).toBe('alert')
        expect(attached().exists()).toBe(false)
        wrapper.unmount()
      }
      wrapper = null

      expect(said).toEqual({
        SOURCE_TOO_LARGE: 'chatThread.imageTooLarge',
        HEIC: 'chatThread.imageHeic',
        FORMAT: 'chatThread.imageFormat',
        unknown: 'chatThread.imageFormat',
      })
    })

    // A picture chosen before stays where the next one fails: nothing took its place.
    it('keeps the picture it had where the next one cannot be opened', async () => {
      mountBar()
      await chooseReady()
      encoding.openChatImage.mockRejectedValueOnce(
        Object.assign(new Error('refused'), { problem: 'HEIC' }),
      )
      await choose()

      expect(problem().text()).toBe('chatThread.imageHeic')
      expect(shown()).toBe(READY.image)
    })

    // Another go: the menu opening again, or a picture that is open, ends the old words.
    it('lets the words about a failed picture go with the next try', async () => {
      mountBar()
      encoding.openChatImage.mockRejectedValueOnce(
        Object.assign(new Error('refused'), { problem: 'FORMAT' }),
      )
      await choose()
      expect(problem().exists()).toBe(true)

      await clip().trigger('click')
      expect(problem().exists()).toBe(false)

      await clip().trigger('click')
      encoding.openChatImage.mockRejectedValueOnce(
        Object.assign(new Error('refused'), { problem: 'FORMAT' }),
      )
      await choose()
      expect(problem().exists()).toBe(true)
      await chooseReady()
      expect(problem().exists()).toBe(false)
    })

    // For the ear: the preview has no words a screen reader would hear on its own.
    it('tells a screen reader how the picture stands', async () => {
      mountBar()
      expect(status().attributes('role')).toBe('status')
      expect(status().text()).toBe('')
      const pending = deferred()
      encoding.openChatImage.mockReturnValueOnce(pending.promise)
      await choose()
      expect(status().text()).toBe('chatThread.imagePreparing')

      pending.resolve(READY)
      await flushPromises()
      expect(status().text()).toBe('chatThread.imageReady. chatThread.imageReadyHint')

      await remove().trigger('click')
      expect(status().text()).toBe('')
    })

    describe('after sending', () => {
      it('takes the picture off with the words once the message went through', async () => {
        framesPassAtOnce()
        mountBar()
        await chooseReady()
        await field().setValue('Unser Stand')
        await sendWith()

        await wrapper.setProps({ sending: true })
        await wrapper.setProps({ sending: false })
        await flushPromises()

        expect(attached().exists()).toBe(false)
        expect(field().element.value).toBe('')
        expect(field().attributes('placeholder')).toBe('chatThread.placeholder {"name":"Lena"}')
      })

      // ⛔ Only what went out: a picture chosen while the message was on its way is the next one's.
      it('keeps a picture chosen while the message was on its way', async () => {
        framesPassAtOnce()
        mountBar()
        await chooseReady(READY)
        await sendWith()
        await wrapper.setProps({ sending: true })

        await chooseReady(OTHER)
        await wrapper.setProps({ sending: false })
        await flushPromises()

        expect(shown()).toBe(OTHER.image)
      })

      // …and a message without a picture takes none off.
      it('keeps a picture chosen while a message without one was on its way', async () => {
        mountBar()
        await field().setValue('Hallo')
        await button().trigger('click')
        await wrapper.setProps({ sending: true })

        await chooseReady()
        await wrapper.setProps({ sending: false })
        await flushPromises()

        expect(field().element.value).toBe('')
        expect(shown()).toBe(READY.image)
      })

      it('keeps the picture and the words where the message did not go through', async () => {
        framesPassAtOnce()
        mountBar()
        await chooseReady()
        await field().setValue('Unser Stand')
        await sendWith()

        await wrapper.setProps({ sending: true })
        await wrapper.setProps({ sending: false, failed: true })
        await flushPromises()

        expect(shown()).toBe(READY.image)
        expect(field().element.value).toBe('Unser Stand')
      })

      /**
       * Two refusals of the server about a picture have their own words (P7a, P7b); every other
       * failure is "not sent", as before.
       */
      it('says in its own words why a message with a picture was refused', async () => {
        mountBar({ failed: true })
        expect(wrapper.find('[data-test="chat-compose-failed"]').text()).toBe('chatThread.notSent')

        await wrapper.setProps({ failedReason: 'IMAGE_NOT_ACCEPTED' })
        expect(wrapper.find('[data-test="chat-compose-failed"]').text()).toBe(
          'chatThread.imageNotAccepted',
        )

        await wrapper.setProps({ failedReason: 'TOO_LARGE_ACROSS_BORDER' })
        expect(wrapper.find('[data-test="chat-compose-failed"]').text()).toBe(
          'chatThread.imageTooLargeAcrossBorder',
        )
      })
    })

    /**
     * ⛔ The picture lives in memory only: the thread's note for a restart takes the words
     * (`draft`), and a picture chosen is not part of them (#3999; E-041, point 5).
     */
    it('hands the words for a restart, and never the picture', async () => {
      mountBar()
      await chooseReady()
      await field().setValue('Unser Stand')

      expect(wrapper.vm.draft()).toBe('Unser Stand')
    })
  })

  /**
   * ⛔ The hint's dialog holds bootstrap-vue-next's names, against the installed package -- the
   * trap ContactWindow.modalProps.spec describes: an unknown name (the Vue-2 `hide-header`) is
   * taken silently as a plain attribute and does nothing. The stub above declares whatever it is
   * given, so only the source against the package can say it.
   */
  it('writes on its dialog only names the installed BModal declares', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatComposeBar.vue'),
      'utf8',
    ).replace(/<!--[\s\S]*?-->/g, '')
    const tags = [...source.matchAll(/<BModal\b([\s\S]*?)>/g)]
    expect(tags, 'one dialog: the hint behind the paperclip').toHaveLength(1)

    const written = [...tags[0][1].matchAll(/(?:^|\s)(:|@)?([a-z][a-z0-9-]*)(?==|\s|$)/g)].map(
      (m) => (m[2] === 'v-model' ? 'model-value' : m[1] === '@' ? `@${m[2]}` : m[2]),
    )
    const camel = (name) => name.replace(/-([a-z])/g, (unused, letter) => letter.toUpperCase())
    const declaredProps = Object.keys(BModal.props ?? {})
    const declaredEvents = [...(BModal.emits ?? [])]
    expect(declaredProps.length, 'could not read BModal props from the package').toBeGreaterThan(0)
    const OURS = ['data-test', 'aria-label']
    const unknown = written
      .filter((name) => !OURS.includes(name))
      .filter((name) =>
        name.startsWith('@')
          ? !declaredEvents.includes(name.slice(1))
          : !declaredProps.includes(camel(name)),
      )

    expect(unknown).toEqual([])
    // No header, so a name of its own; not rendered while closed; in the middle of the screen.
    expect(written).toEqual(expect.arrayContaining(['no-header', 'aria-label', 'lazy', 'centered']))
    expect(written).not.toContain('hide-header')
  })

  /**
   * The field grows with its text and scrolls inside past five lines. jsdom lays nothing out,
   * so the height is fed in as the browser would report it, and the limit is read from the
   * stylesheet.
   */
  it('grows with its text', async () => {
    mountBar()
    Object.defineProperty(field().element, 'scrollHeight', { configurable: true, value: 88 })

    await field().setValue('eins\nzwei\ndrei')

    expect(field().element.style.height).toBe('88px')
  })

  const style = () =>
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ChatComposeBar.vue'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!--[\s\S]*?-->/g, '')

  /**
   * ⛔ Three rules only the stylesheet holds, comments stripped first so their explanations
   * cannot stand in for them: the field's 16 px (Safari on the iPhone zooms into anything
   * smaller the moment it is touched), its limit of five lines, and a visible focus on the
   * three controls (jsdom draws no outlines).
   */
  it('keeps the field at 16 px and five lines, and shows where the focus is', () => {
    const code = style()
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.chat-compose-field')).toMatch(/font-size:\s*1rem/)
    expect(rule('\\.chat-compose-field')).toMatch(/max-height:\s*calc\(7em/)
    expect(rule('\\.chat-compose-field:focus-visible')).toMatch(/border-color:\s*var\(--success/)
    expect(rule('\\.chat-compose-send:focus-visible')).toMatch(/outline:\s*2px solid/)
    expect(rule('\\.chat-compose-check-box:focus-visible')).toMatch(/outline:\s*2px solid/)
    expect(rule('\\.chat-compose-attach:focus-visible')).toMatch(/outline:\s*2px solid/)
  })

  /**
   * The paperclip is as large as the send button at the other end of the row (the mockup, E-044),
   * round, and drawn without a fill -- the sign in the muted colour, as the contact window's gear
   * and camera are.
   */
  it('draws the paperclip round and as large as the send button, without a fill', () => {
    const code = style()
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    const size = (body) => [
      body.match(/(?:^|\s)width:\s*([^;]+);/)?.[1],
      body.match(/(?:^|\s)height:\s*([^;]+);/)?.[1],
    ]
    const clip = rule('\\.chat-compose-attach')

    expect(size(clip)).toEqual(size(rule('\\.chat-compose-send')))
    expect(size(clip)).toEqual(['2.4rem', '2.4rem'])
    expect(clip).toMatch(/border-radius:\s*50%/)
    expect(clip).toMatch(/background:\s*transparent/)
    expect(clip).toMatch(/color:\s*var\(--bs-secondary-color/)
  })

  /**
   * ⛔ What only the stylesheet holds about the menu (jsdom applies no styles): a closed menu is
   * hidden with `visibility`, never `display` -- its field has to stay rendered for the picker --
   * its entries are a finger's size, their signs gold, and the picture's label shows its hidden
   * field's focus.
   */
  it('hides a closed menu without taking it out, and draws its entries as the mockup has them', () => {
    const code = style()
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.chat-compose-menu:not\\(\\.is-open\\)')).toMatch(/visibility:\s*hidden/)
    expect(code).not.toMatch(/\.chat-compose-menu[^{]*\{[^}]*display:\s*none/)
    expect(rule('\\.chat-compose-menu')).toMatch(/position:\s*absolute/)
    expect(rule('\\.chat-compose-menu')).toMatch(/bottom:\s*calc\(100%/)
    const item = rule('\\.chat-compose-menu-item')
    const height = item.match(/min-height:\s*([\d.]+)rem/)?.[1]
    expect(Number(height) * 16).toBeGreaterThanOrEqual(44)
    // The gold of the menus' signs, tuned to the menus' own grey (E-061, chatMenuSurface.spec.js).
    expect(rule('\\.chat-compose-menu-icon')).toMatch(/color:\s*var\(--menu-icon/)
    expect(
      rule(
        '\\.chat-compose-menu-item:focus-visible,\\s*\\.chat-compose-picker:focus-visible \\+ \\.chat-compose-menu-item',
      ),
    ).toMatch(/outline:\s*2px solid/)
    // The bar is what the menu hangs from.
    expect(rule('\\.chat-compose')).toMatch(/position:\s*relative/)
  })

  /**
   * ⛔ The white arrow on the button's gold reaches the 3:1 a symbol needs to be made out
   * (WCAG 1.4.11). The house gold #c58d38 falls just short of it (2.9:1), so the button has a
   * gold of its own, a touch darker (Bernd, 24.09.2026).
   */
  it('shows the white arrow on a gold it can be made out on', () => {
    const rule = style().match(/\n\.chat-compose-send\s*\{([^}]*)\}/)?.[1] ?? ''
    const colour = (property) =>
      rule.match(new RegExp(`(?:^|\\s)${property}:\\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?);`, 'i'))?.[1]
    const luminance = (hex) => {
      const digits =
        hex.length === 4 ? [...hex.slice(1)].map((d) => d + d) : hex.slice(1).match(/../g)
      const [r, g, b] = digits.map((d) => {
        const c = parseInt(d, 16) / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ground = colour('background')
    const arrow = colour('color')

    expect(ground, 'no plain gold on the button to measure').toBeDefined()
    expect(arrow, 'no plain colour on the arrow to measure').toBeDefined()
    const [lighter, darker] = [luminance(arrow), luminance(ground)].sort((x, y) => y - x)
    expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(3)
  })

  /**
   * ⛔ The tick that saves a change (E-060) stands on the wallet's green, and that green is another
   * in dark mode -- a light one, on which the white tick falls short (2.4:1). Both grounds are
   * written out, and each is held against the tick that stands on it.
   */
  it('shows the tick on a green it can be made out on, in both modes', () => {
    const code = style()
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    const colour = (css, property) =>
      css.match(new RegExp(`(?:^|\\s)${property}:\\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?);`, 'i'))?.[1]
    const luminance = (hex) => {
      const digits =
        hex.length === 4 ? [...hex.slice(1)].map((d) => d + d) : hex.slice(1).match(/../g)
      const [r, g, b] = digits.map((d) => {
        const c = parseInt(d, 16) / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const contrast = (one, other) => {
      const [lighter, darker] = [luminance(one), luminance(other)].sort((x, y) => y - x)
      return (lighter + 0.05) / (darker + 0.05)
    }
    const button = rule('\\.chat-compose-send')
    const light = rule('\\.chat-compose-send\\.is-save')
    const dark = rule('\\.dark-mode \\.chat-compose-send\\.is-save')

    // Light: the button's own white tick on the dark green.
    expect(colour(light, 'background'), 'no plain green to measure').toBeDefined()
    expect(colour(light, 'color')).toBeUndefined()
    expect(contrast(colour(button, 'color'), colour(light, 'background'))).toBeGreaterThanOrEqual(3)
    // Dark: a tick of its own on the light green.
    expect(colour(dark, 'background'), 'no plain green to measure in dark mode').toBeDefined()
    expect(colour(dark, 'color'), 'no plain tick to measure in dark mode').toBeDefined()
    expect(contrast(colour(dark, 'color'), colour(dark, 'background'))).toBeGreaterThanOrEqual(3)
    // Gegenprobe: the white tick would not do on the light green -- which is why it has its own.
    expect(contrast(colour(button, 'color'), colour(dark, 'background'))).toBeLessThan(3)
  })
})
