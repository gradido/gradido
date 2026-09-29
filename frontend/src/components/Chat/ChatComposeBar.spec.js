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
          IMdiFileDocument: true,
          IMdiClose: true,
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

    // Asked when the hint opens, nothing kept: the next opening asks again.
    it('asks whether this is a computer each time the hint opens', async () => {
      await openHint()
      expect(isComputer).toHaveBeenCalledTimes(1)
      await wrapper.find('[data-test="chat-compose-file-close"]').trigger('click')

      vi.mocked(isComputer).mockReturnValue(false)
      await chooseFileEntry()

      expect(isComputer).toHaveBeenCalledTimes(2)
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
     * script's click. Pictures only, and no `capture`: on a phone the picker offers the camera by
     * itself (AS-012).
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
    expect(rule('\\.chat-compose-menu-icon')).toMatch(/color:\s*var\(--gold/)
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
})
