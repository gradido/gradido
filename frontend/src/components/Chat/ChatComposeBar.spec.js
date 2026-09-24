// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatComposeBar from './ChatComposeBar.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

describe('ChatComposeBar', () => {
  let wrapper

  const mountBar = (props = {}, options = {}) => {
    wrapper = mount(ChatComposeBar, {
      props: { name: 'Lena', first: false, sending: false, failed: false, ...props },
      global: { stubs: { IMdiEmailOutline: true, IMdiSend: true } },
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
