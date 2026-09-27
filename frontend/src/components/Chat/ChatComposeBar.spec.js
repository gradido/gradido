// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { BModal } from 'bootstrap-vue-next'
import ChatComposeBar from './ChatComposeBar.vue'
import { SWISSTRANSFER_URL } from '@/utils/chatFileLink'
import { isComputer } from '@/utils/isComputer'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

// A computer unless a test says otherwise; the check itself has its own spec.
vi.mock('@/utils/isComputer', () => ({ isComputer: vi.fn(() => true) }))

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

      expect(sent()).toEqual([[{ body: 'Hallo Lena', notify: 'NONE' }]])
    })

    it('asks for the mail where the box is ticked', async () => {
      mountBar()
      await field().setValue('Hallo Lena')
      await box().setValue(true)

      await button().trigger('click')

      expect(sent()).toEqual([[{ body: 'Hallo Lena', notify: 'EMAIL' }]])
    })

    // The server mails the first message anyway; the request says what will happen.
    it('asks for the mail with the first message, without a box', async () => {
      mountBar({ first: true })
      await field().setValue('Hallo Lena')

      await button().trigger('click')

      expect(sent()).toEqual([[{ body: 'Hallo Lena', notify: 'EMAIL' }]])
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
        [{ body: 'Hallo', notify: 'NONE' }],
        [{ body: 'Hallo', notify: 'NONE' }],
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
  describe('the paperclip and its hint', () => {
    const clip = () => wrapper.find('[data-test="chat-compose-attach"]')
    const hint = () => wrapper.find('[data-test="chat-compose-file-hint"]')
    const openLink = () => wrapper.find('[data-test="chat-compose-file-open"]')

    const openHint = async (props = {}, options = {}) => {
      mountBar(props, options)
      await clip().trigger('click')
      return hint()
    }

    // A sign without a word (the learnt exception to E-033), so its name is what a screen reader
    // and a hovering mouse get -- and it stands first in the row, before the field.
    it('stands before the field, as a button with its name', () => {
      mountBar()

      const row = wrapper.find('.chat-compose-row').element
      expect(row.firstElementChild).toBe(clip().element)
      expect(
        clip().element.compareDocumentPosition(field().element) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(clip().element.tagName).toBe('BUTTON')
      expect(clip().attributes('type')).toBe('button')
      expect(clip().attributes('aria-label')).toBe('chatThread.fileAttach')
      expect(clip().attributes('title')).toBe('chatThread.fileAttach')
      expect(clip().attributes('aria-haspopup')).toBe('dialog')
    })

    // A link is an ordinary message: there is no reason to leave it out of the first one.
    it('is there with the first message of a conversation too', () => {
      mountBar({ first: true })
      expect(clip().exists()).toBe(true)
      expect(wrapper.find('[data-test="chat-compose-first"]').exists()).toBe(true)
    })

    // E-044, F1: straight to the hint -- a menu with one entry would be a click too many.
    it('opens the hint with one click, named as the title it has instead of a header', async () => {
      mountBar()
      expect(hint().exists()).toBe(false)

      await clip().trigger('click')

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
      await clip().trigger('click')

      expect(isComputer).toHaveBeenCalledTimes(2)
      expect(wrapper.find('[data-test="chat-compose-file-tip"]').exists()).toBe(true)
    })

    // The paperclip sends nothing and takes nothing away: the text and the box stay.
    it('leaves the field and the box as they are', async () => {
      mountBar()
      await field().setValue('Hier ist die Datei:')
      await box().setValue(true)

      await clip().trigger('click')
      await wrapper.find('[data-test="chat-compose-file-close"]').trigger('click')

      expect(sent()).toEqual([])
      expect(field().element.value).toBe('Hier ist die Datei:')
      expect(box().element.checked).toBe(true)
      await button().trigger('click')
      expect(sent()).toEqual([[{ body: 'Hier ist die Datei:', notify: 'EMAIL' }]])
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
