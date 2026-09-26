// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatBubble from './ChatBubble.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date, format) => `${format}(${date.toISOString()})`,
  }),
}))

/**
 * A message as chatMessagesWithMemberQuery delivers it. ⚠️ The enum fields carry the NAMES
 * (EMAIL, PENDING …): that is what goes over the wire, measured with the backend's own
 * type-graphql and graphql. A fixture with the lower-case column values would test a server
 * that does not exist.
 */
const OWN = {
  id: 7,
  messageUuid: 'uuid-7',
  conversationId: 3,
  sender: { communityUuid: 'home-uuid', gradidoID: 'me-id' },
  mine: true,
  subject: null,
  body: 'Gern! Ich bringe Samstag ein paar Töpfe mit.',
  createdAt: '2026-09-22T14:30:00.000Z',
  deliveryState: 'DELIVERED',
  notify: 'NONE',
  // No mail asked for, so nothing became of one (E-034).
  mailState: null,
}

const THEIRS = {
  ...OWN,
  id: 6,
  messageUuid: 'uuid-6',
  sender: { communityUuid: 'home-uuid', gradidoID: 'lena-id' },
  mine: false,
  body: 'Hättest Du noch Rosmarin übrig?',
  createdAt: '2026-09-22T14:02:00.000Z',
  // The server fills none of them for somebody else's message.
  deliveryState: null,
  notify: null,
  mailState: null,
}

describe('ChatBubble', () => {
  let wrapper

  const mountBubble = (message, alias = 'Lena') => {
    wrapper = mount(ChatBubble, {
      props: { message, alias },
      global: { stubs: { IMdiEmailOutline: { template: '<i data-test="envelope" />' } } },
    })
    return wrapper
  }

  const bubble = () => wrapper.find('[data-test="chat-bubble"]')

  afterEach(() => {
    wrapper?.unmount()
  })

  // E-014: one's own on the right, the other person's on the left.
  it("puts one's own message on the right and the other person's on the left", () => {
    mountBubble(OWN)
    expect(bubble().classes()).toContain('chat-bubble-mine')
    expect(bubble().classes()).not.toContain('chat-bubble-theirs')
    wrapper.unmount()

    mountBubble(THEIRS)
    expect(bubble().classes()).toContain('chat-bubble-theirs')
    expect(bubble().classes()).not.toContain('chat-bubble-mine')
  })

  // It is a list item: the thread is a list.
  it("is an item of the thread's list", () => {
    expect(mountBubble(OWN).element.tagName).toBe('LI')
  })

  /**
   * E-013: a message written with the e-mail form carries its subject, bold over the text. A
   * message without one has no line for it -- not an empty one.
   */
  it('shows the subject over the text only where there is one', () => {
    mountBubble({ ...THEIRS, subject: 'Kräuter vom Markt' })
    expect(wrapper.find('[data-test="chat-bubble-subject"]').text()).toBe('Kräuter vom Markt')
    wrapper.unmount()

    mountBubble(THEIRS)
    expect(wrapper.find('[data-test="chat-bubble-subject"]').exists()).toBe(false)
    wrapper.unmount()

    mountBubble({ ...THEIRS, subject: '' })
    expect(wrapper.find('[data-test="chat-bubble-subject"]').exists()).toBe(false)
  })

  it("shows the text, with its bold runs, through the chat's own text component", () => {
    mountBubble({ ...THEIRS, body: 'Das ist **wichtig**.' })
    expect(wrapper.find('.chat-message-text strong').text()).toBe('wichtig')
  })

  /**
   * V4a: a video room's link shows its server and room; the topic's encoded addition stays out of
   * sight -- the invitation names the topic in words above it. The link goes to the whole address,
   * addition and all: that is what gives the meeting its title.
   */
  it("shows a video room's link without the topic's addition, and leads to the whole address", () => {
    const room = 'https://meet.ffmuc.net/k7m2x9q4t8wz'
    const address = `${room}#config.subject=%22Gespr%C3%A4ch%20%C3%BCber%20B%C3%A4ume%22`
    mountBubble({
      ...THEIRS,
      body: `📹 Videoanruf: Gespräch über Bäume\nDer Raum liegt auf einem Jitsi-Server von Freifunk München — ein Vorschlag, kein Dienst von Gradido: ${address}`,
    })

    const link = wrapper.find('.chat-message-text a')
    expect(link.text()).toBe(room)
    expect(link.attributes('href')).toBe(address)
    expect(wrapper.find('.chat-message-text').text()).not.toContain('config.subject')
  })

  // Only that one addition: an address with anything else after `#` is shown as it is.
  it.each([
    'https://gradido.net/de/faq#konto',
    'https://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=x&config.startWithAudioMuted=true',
  ])('shows any other address whole: %s', (address) => {
    mountBubble({ ...THEIRS, body: `Schau mal: ${address}` })

    const link = wrapper.find('.chat-message-text a')
    expect(link.text()).toBe(address)
    expect(link.attributes('href')).toBe(address)
  })

  // E-018: the time is when it arrived here, as a machine-readable <time> and a short one to
  // read.
  it('says when it arrived, as a time of day', () => {
    mountBubble(OWN)
    const time = wrapper.find('[data-test="chat-bubble-time"]')

    expect(time.element.tagName).toBe('TIME')
    expect(time.attributes('datetime')).toBe('2026-09-22T14:30:00.000Z')
    expect(time.text()).toBe('time(2026-09-22T14:30:00.000Z)')
  })

  const envelope = () => wrapper.find('[data-test="chat-bubble-mailed"]')
  const notMailed = () => wrapper.find('[data-test="chat-bubble-not-mailed"]')

  describe('the envelope', () => {
    // E-034: on one's own message, where the server says a mail about it went out.
    it("marks one's own message whose mail went out, with a name", () => {
      mountBubble({ ...OWN, notify: 'EMAIL', mailState: 'MAILED' })

      expect(envelope().exists()).toBe(true)
      expect(envelope().attributes('role')).toBe('img')
      expect(envelope().attributes('aria-label')).toBe('chatThread.mailed')
    })

    // ⛔ The point of P3c (E-034, A2): a mail that the recipient's mute held back is no mail.
    it('is not there where the recipient muted the conversation', () => {
      mountBubble({ ...OWN, notify: 'EMAIL', mailState: 'MUTED' })
      expect(envelope().exists()).toBe(false)
    })

    it('is not there where one did not ask for a mail', () => {
      mountBubble({ ...OWN, notify: 'NONE', mailState: null })
      expect(envelope().exists()).toBe(false)
    })

    /**
     * ⚠️ Null with the wish EMAIL keeps the envelope it had (P3b): that is a message from before
     * `mailState`, or one to a server from before it, and the history keeps its envelopes.
     */
    it('stays where one asked for a mail and the server knows nothing more', () => {
      mountBubble({ ...OWN, notify: 'EMAIL', mailState: null })
      expect(envelope().exists()).toBe(true)
      wrapper.unmount()

      // A copy asked for before the field was in the document: no `mailState` at all.
      const withoutMailState = { ...OWN, notify: 'EMAIL' }
      delete withoutMailState.mailState
      mountBubble(withoutMailState)
      expect(envelope().exists()).toBe(true)
    })

    // ...but not beside a word that says the message has not arrived: from a server that did
    // not get it, no mail can have gone out.
    it('is not beside "not delivered" or "not delivered yet"', () => {
      mountBubble({ ...OWN, notify: 'EMAIL', mailState: null, deliveryState: 'FAILED' })
      expect(envelope().exists()).toBe(false)
      wrapper.unmount()

      mountBubble({ ...OWN, notify: 'EMAIL', mailState: null, deliveryState: 'PENDING' })
      expect(envelope().exists()).toBe(false)
    })

    // A value this wallet has no word for says nothing, rather than a wish it cannot vouch for.
    it('is not there for a state this wallet does not know', () => {
      mountBubble({ ...OWN, notify: 'EMAIL', mailState: 'SOMETHING_NEW' })
      expect(envelope().exists()).toBe(false)
      expect(notMailed().exists()).toBe(false)
    })

    // ⛔ Nothing about the other side's mail: the server sends nothing for it, and a stray
    // value would still draw nothing.
    it("is never on the other person's message", () => {
      mountBubble({ ...THEIRS, notify: 'EMAIL', mailState: 'MAILED' })
      expect(envelope().exists()).toBe(false)
      wrapper.unmount()

      mountBubble({ ...THEIRS, notify: 'EMAIL', mailState: null })
      expect(envelope().exists()).toBe(false)
    })

    /**
     * ⛔ The enum NAME is what arrives. A comparison against the column value ('email', 'mailed')
     * would never be true on the real server -- this is the test that says which one is meant.
     */
    it('answers to the enum name, not to the column value', () => {
      mountBubble({ ...OWN, notify: 'email' })
      expect(envelope().exists()).toBe(false)
      wrapper.unmount()

      mountBubble({ ...OWN, notify: 'NONE', mailState: 'mailed' })
      expect(envelope().exists()).toBe(false)
    })
  })

  describe('the line where no mail went out', () => {
    // E-034, A2: the sender learns that no mail went, and why -- in words, with the name.
    it('says that the recipient turned the mails off, and who', () => {
      mountBubble({ ...OWN, notify: 'EMAIL', mailState: 'MUTED' }, 'Lena')

      expect(notMailed().text()).toBe('chatThread.notMailedMuted {"name":"Lena"}')
      // Text in the list item, read with the message -- not a sign that needs a name.
      expect(notMailed().element.closest('[data-test="chat-bubble"]')).toBe(wrapper.element)
      expect(notMailed().attributes('role')).toBeUndefined()
    })

    it('is not there where the mail went out, none was asked for, or nothing is known', () => {
      for (const own of [
        { notify: 'EMAIL', mailState: 'MAILED' },
        { notify: 'NONE', mailState: null },
        { notify: 'EMAIL', mailState: null },
      ]) {
        mountBubble({ ...OWN, ...own })
        expect(notMailed().exists(), JSON.stringify(own)).toBe(false)
        wrapper.unmount()
      }
    })

    // ⛔ The other side's mute is theirs to know; on their messages the server sends no state.
    it("is never under the other person's message", () => {
      mountBubble({ ...THEIRS, notify: 'EMAIL', mailState: 'MUTED' })
      expect(notMailed().exists()).toBe(false)
    })

    it('answers to the enum name here too', () => {
      mountBubble({ ...OWN, notify: 'EMAIL', mailState: 'muted' })
      expect(notMailed().exists()).toBe(false)
    })
  })

  describe("the word under one's own message", () => {
    it('says "not delivered yet" while it is pending', () => {
      mountBubble({ ...OWN, deliveryState: 'PENDING' })
      expect(wrapper.find('[data-test="chat-bubble-state"]').text()).toBe('chatThread.pending')
    })

    it('says "not delivered" where it failed', () => {
      mountBubble({ ...OWN, deliveryState: 'FAILED' })
      expect(wrapper.find('[data-test="chat-bubble-state"]').text()).toBe('chatThread.failed')
    })

    // ⛔ Only the exception is information; "delivered" under every message would be noise.
    it('says nothing where it was delivered', () => {
      mountBubble({ ...OWN, deliveryState: 'DELIVERED' })
      expect(wrapper.find('[data-test="chat-bubble-state"]').exists()).toBe(false)
    })

    it("says nothing under the other person's message, whatever it carries", () => {
      mountBubble({ ...THEIRS, deliveryState: 'FAILED' })
      expect(wrapper.find('[data-test="chat-bubble-state"]').exists()).toBe(false)
    })

    it('answers to the enum name here too', () => {
      mountBubble({ ...OWN, deliveryState: 'pending' })
      expect(wrapper.find('[data-test="chat-bubble-state"]').exists()).toBe(false)
    })
  })

  /**
   * ⛔ Which side a bubble stands on is the only thing that says who wrote it, and a screen
   * reader does not see sides. The writer is named in words that are hidden from the eye.
   */
  it('names the writer for a screen reader, hidden from the eye', () => {
    mountBubble(OWN)
    const own = wrapper.find('[data-test="chat-bubble-writer"]')
    expect(own.classes()).toContain('visually-hidden')
    expect(own.text()).toBe('chatThread.you:')
    wrapper.unmount()

    mountBubble(THEIRS, 'Lena')
    expect(wrapper.find('[data-test="chat-bubble-writer"]').text()).toBe('Lena:')
  })

  /**
   * ⛔ The hidden name is `position: absolute` (Bootstrap's `.visually-hidden`), so it is laid
   * out against the nearest positioned ancestor. Without one in the bubble it hung below the
   * window and made the whole window scroll on a phone -- measured, 987 px of modal on an
   * 844 px screen. jsdom lays nothing out, so the stylesheet is what can be read: the bubble
   * has to be that ancestor. Comments stripped first, since the rule's explanation names it.
   */
  it('keeps the hidden name inside the bubble, in the stylesheet', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
      'utf8',
    )
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
    const rule = code.match(/\n\.chat-bubble\s*\{[^}]*\}/)

    expect(rule, '.chat-bubble no longer has a rule of its own').not.toBeNull()
    expect(rule[0]).toMatch(/position:\s*relative/)
    expect(code).toMatch(/class="visually-hidden"/)
  })

  /**
   * E-034: the line where no mail went out is quiet -- the muted tone of the time, in both
   * modes, by the same rules (each mode needs its own means, see the stylesheet). And it breaks
   * a name without a space: a Gradido ID stands in for a missing user name, 36 characters, and
   * would otherwise push past the window. jsdom lays nothing out, so the stylesheet is read,
   * comments stripped first.
   */
  it('keeps the line where no mail went out in the tone of the time, and lets a long name break', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
      'utf8',
    )
    const style = source.slice(source.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')
    const rules = [...style.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selectors, body]) => ({
      selectors: selectors.split(',').map((selector) => selector.trim()),
      body,
    }))
    const colourOf = (selector) =>
      rules.filter((rule) => rule.selectors.includes(selector) && /(^|[^-])color:/.test(rule.body))

    for (const mode of ['', '.dark-mode ']) {
      const time = colourOf(`${mode}.chat-bubble-meta`)
      expect(time, `${mode}time`).toHaveLength(1)
      expect(time[0].selectors, `${mode}line`).toContain(`${mode}.chat-bubble-not-mailed`)
    }
    const line = rules.find(
      (rule) =>
        rule.selectors.includes('.chat-bubble-not-mailed') && /overflow-wrap/.test(rule.body),
    )
    expect(line?.body).toMatch(/overflow-wrap:\s*anywhere/)
  })
})
