// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatBubble from './ChatBubble.vue'
import { CHAT_VIDEO_JOIN } from '@/utils/chatVideoApp'
import { withChatVideoTopic } from '@/utils/chatVideoTopic'

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
      global: {
        stubs: {
          IMdiEmailOutline: { template: '<i data-test="envelope" />' },
          IMdiCalendarPlusOutline: true,
          IMdiFileDocumentOutline: true,
          IMdiOpenInNew: true,
        },
      },
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

  /**
   * V4b: on a computer a click on the link of an invitation of our own asks first -- through the
   * question the contact window provides (`CHAT_VIDEO_JOIN`), here a stand-in that notes what it
   * was handed. The device is the browser's to say (chatVideoApp): a stand-in for `matchMedia`
   * that answers the one question asked, where jsdom has none -- the state every other test runs
   * in, and the phone's answer.
   */
  describe('the question before joining a call', () => {
    const ROOM = 'https://meet.ffmuc.net/k7m2x9q4t8wz'
    const ADDRESS = `${ROOM}#config.subject=%22Gespr%C3%A4ch%20%C3%BCber%20B%C3%A4ume%22`
    const INVITATION = `📹 Videoanruf: Gespräch über Bäume\nDer Raum liegt auf einem Jitsi-Server von Freifunk München — ein Vorschlag, kein Dienst von Gradido: ${ADDRESS}`

    let asked
    const mountAsking = (message, { provided = true } = {}) => {
      asked = []
      wrapper = mount(ChatBubble, {
        props: { message, alias: 'Lena' },
        global: {
          provide: provided ? { [CHAT_VIDEO_JOIN]: (roomUrl) => asked.push(roomUrl) } : {},
          stubs: { IMdiEmailOutline: true },
        },
      })
    }
    const onA = ({ computer }) => {
      vi.stubGlobal('matchMedia', (query) => ({
        matches: query === '(pointer: fine) and (hover: hover)' && computer,
      }))
    }
    const links = () => wrapper.findAll('.chat-message-text a')
    /** A click as the member makes it; `false` where the page claimed it (preventDefault). */
    const click = (init = {}) =>
      links()[0].element.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }),
      )

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('asks instead of opening, on a computer, and hands over the whole address', () => {
      onA({ computer: true })
      mountAsking({ ...THEIRS, body: INVITATION })

      expect(click()).toBe(false)
      expect(asked).toEqual([ADDRESS])
    })

    // The link stays the room's: copy, the middle button and a new tab work as on any link.
    it('stays one link to the room, with no second way beside it', () => {
      onA({ computer: true })
      mountAsking({ ...THEIRS, body: INVITATION })

      expect(links()).toHaveLength(1)
      expect(links()[0].attributes('href')).toBe(ADDRESS)
      expect(links()[0].attributes('target')).toBe('_blank')
      expect(links()[0].attributes('rel')).toBe('noopener noreferrer')
      expect(links()[0].text()).toBe(ROOM)
      expect(wrapper.find('.chat-message-text').text().endsWith(ROOM)).toBe(true)
    })

    it("asks in one's own bubble too", () => {
      onA({ computer: true })
      mountAsking({ ...OWN, body: INVITATION })

      expect(click()).toBe(false)
      expect(asked).toEqual([ADDRESS])
    })

    it.each([
      ['Ctrl', { ctrlKey: true }],
      ['Cmd', { metaKey: true }],
      ['Shift', { shiftKey: true }],
      ['Alt', { altKey: true }],
      ['another button', { button: 1 }],
    ])('leaves a click with %s to the browser', (_, init) => {
      onA({ computer: true })
      mountAsking({ ...THEIRS, body: INVITATION })

      expect(click(init)).toBe(true)
      expect(asked).toEqual([])
    })

    // Phones and tablets: Jitsi's own page offers its app there.
    it('opens the room straight away on a phone or a tablet', () => {
      onA({ computer: false })
      mountAsking({ ...THEIRS, body: INVITATION })

      expect(click()).toBe(true)
      expect(asked).toEqual([])
    })

    // Asked at the click, nothing kept: a drawing made on a phone still asks on a computer.
    it('asks the device at the click, not at the drawing', () => {
      onA({ computer: false })
      mountAsking({ ...THEIRS, body: INVITATION })

      onA({ computer: true })
      expect(click()).toBe(false)
      expect(asked).toEqual([ADDRESS])
    })

    it('stays a plain link where no window provides the question', () => {
      onA({ computer: true })
      mountAsking({ ...THEIRS, body: INVITATION }, { provided: false })

      expect(click()).toBe(true)
    })

    it.each([
      ['a page', 'https://gradido.net/de/faq#konto'],
      ['a room with a second setting', `${ADDRESS}&config.startWithAudioMuted=true`],
      ['a room over http', ADDRESS.replace('https:', 'http:')],
    ])("does not ask for somebody else's address: %s", (_, address) => {
      onA({ computer: true })
      mountAsking({ ...THEIRS, body: `Schau mal: ${address}` })

      expect(click()).toBe(true)
      expect(asked).toEqual([])
    })
  })

  /**
   * Paket D (E-042, E-044): Gradido stores no files. A link to files on SwissTransfer comes as an
   * ordinary message, and the thread shows it as a file card in place of the address; the words
   * around it stay.
   */
  describe('a link to files on SwissTransfer', () => {
    const LINK = 'https://www.swisstransfer.com/d/7f3a9c2e-5b1d-4e8a-9c3f-2d6b8a1e4f70'
    const card = () => wrapper.find('[data-test="chat-file-card"]')
    const text = () => wrapper.find('.chat-message-text')
    /** What the text is made of, in order: its text as it stands, and its elements by class. */
    const pieces = () =>
      [...text().element.childNodes].map((node) =>
        node.nodeType === Node.TEXT_NODE ? node.textContent : `<${node.className}>`,
      )

    it('becomes a card in place of the address, leading there in a tab of its own', () => {
      mountBubble({ ...THEIRS, body: `Hier ist die Datei:\n${LINK}` })

      expect(card().element.tagName).toBe('A')
      expect(card().attributes('href')).toBe(LINK)
      expect(card().attributes('target')).toBe('_blank')
      expect(card().attributes('rel')).toBe('noopener noreferrer')
      expect(card().text()).toContain('chatThread.fileCard')
      expect(wrapper.find('[data-test="chat-file-card-where"]').text()).toBe(
        'swisstransfer.com/d/7f3a9c2e-5b1d-4e8a-9c3f-2d6b8a1e4f70',
      )
      // The card is the one link: the address does not stand in the text beside it.
      expect(wrapper.findAll('.chat-message-text a')).toHaveLength(1)
      expect(text().text()).not.toContain('https://')
    })

    /**
     * The four more (Bernd, 27.09.2026): the same card, naming the service, over host and path.
     * The query carries the link's key -- it goes with the tap and stays out of sight.
     */
    it.each([
      [
        'Dropbox',
        'https://www.dropbox.com/scl/fi/k7m2x9q4t8wzp3n6r1v5c/Bericht.pdf?rlkey=q2w3e4r5t6y7u8i9o0p1a2s3d&dl=0',
        'dropbox.com/scl/fi/k7m2x9q4t8wzp3n6r1v5c/Bericht.pdf',
      ],
      [
        'Google Drive',
        'https://drive.google.com/file/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/view?usp=drive_link',
        'drive.google.com/file/d/1QwErTyUiOpAsDfGhJkLzXcVbNm123456/view',
      ],
      [
        'OneDrive',
        'https://1drv.ms/u/c/1a2b3c4d5e6f7a8b/EQwErTyUiOpAsDfGhJkLzXcBQwErTyUiOp?e=AbC123',
        '1drv.ms/u/c/1a2b3c4d5e6f7a8b/EQwErTyUiOpAsDfGhJkLzXcBQwErTyUiOp',
      ],
      ['WeTransfer', 'https://we.tl/t-Qw3Er5Ty7U', 'we.tl/t-Qw3Er5Ty7U'],
    ])('is a card for a link to %s, naming it', (service, address, where) => {
      mountBubble({ ...THEIRS, body: `Hier ist die Datei:\n${address}` })

      expect(card().attributes('href')).toBe(address)
      expect(card().find('.chat-file-card-title').text()).toBe(
        `chatThread.fileCard ${JSON.stringify({ service })}`,
      )
      expect(wrapper.find('[data-test="chat-file-card-where"]').text()).toBe(where)
      expect(pieces()).toEqual(['Hier ist die Datei:', '<chat-file-card>'])
    })

    // In one's own bubble the same.
    it("is a card in one's own bubble too", () => {
      mountBubble({ ...OWN, body: LINK })
      expect(card().attributes('href')).toBe(LINK)
    })

    // SwissTransfer's app shares a transfer from its second host: the same card, naming that host.
    it("is a card for a link of SwissTransfer's app, naming the app's host", () => {
      const appLink = 'https://swisstransfer.infomaniak.com/dl/018f6c2b-9c8d-7e6f-8a5b-4c3d2e1f0a9b'
      mountBubble({ ...THEIRS, body: `Hier ist die Datei:\n${appLink}` })

      expect(card().attributes('href')).toBe(appLink)
      expect(wrapper.find('[data-test="chat-file-card-where"]').text()).toBe(
        'swisstransfer.infomaniak.com/dl/018f6c2b-9c8d-7e6f-8a5b-4c3d2e1f0a9b',
      )
      expect(pieces()).toEqual(['Hier ist die Datei:', '<chat-file-card>'])
    })

    // ⛔ The bubble keeps a message's own line breaks: a break after the link would stand as an
    // empty line under the card, a blank line before it as one over it (measured in the probe,
    // 27.09.2026). The space right next to the card goes, whatever it is.
    it('keeps the words around it, without the space right next to it', () => {
      mountBubble({ ...THEIRS, body: `Hier ist die Datei:\n${LINK}\nViel Freude damit!` })
      expect(pieces()).toEqual(['Hier ist die Datei:', '<chat-file-card>', 'Viel Freude damit!'])
    })

    // Only the space right next to the card: the message's own lines elsewhere stay as written.
    it('leaves the line breaks elsewhere in the message as they are', () => {
      mountBubble({ ...THEIRS, body: `Erste Zeile\n\nZweite Zeile: ${LINK}` })
      expect(pieces()).toEqual(['Erste Zeile\n\nZweite Zeile:', '<chat-file-card>'])
    })

    // Gegenprobe: around any other link, and in a message without a card, nothing is taken away.
    it('leaves the space around any other link as it was written', () => {
      mountBubble({ ...THEIRS, body: '  Schau mal:\nhttps://gradido.net/de/\nDanke  ' })
      expect(pieces()).toEqual(['  Schau mal:\n', '<>', '\nDanke  '])
    })

    it('is the card and nothing else where the message is the link alone', () => {
      mountBubble({ ...OWN, body: `  ${LINK}\n` })
      expect(pieces()).toEqual(['<chat-file-card>'])
    })

    it('gives every link its own card, and nothing is left between them', () => {
      const other = 'https://www.swisstransfer.com/dl/Ab3dE5fG'
      mountBubble({ ...OWN, body: `${LINK}\n\n${other}` })

      expect(pieces()).toEqual(['<chat-file-card>', '<chat-file-card>'])
      expect(
        wrapper.findAll('[data-test="chat-file-card"]').map((each) => each.attributes('href')),
      ).toEqual([LINK, other])
    })

    it.each([
      ['a link to another service', 'https://www.filemail.com/d/qwertyuiopasdfg'],
      // Nextcloud runs on any address (Bernd, 27.09.2026: an ordinary link).
      ['a Nextcloud share', 'https://cloud.example.org/s/aBcDeFgHiJkLmNo'],
      ['a page of SwissTransfer that is no download', 'https://www.swisstransfer.com/de/faq'],
      ['a SwissTransfer link with a query', `${LINK}?password=123`],
      ['a host that only looks like it', 'https://swisstransfer.com.example.org/d/7f3a9c2e'],
      ['another service of Infomaniak', 'https://kdrive.infomaniak.com/dl/7f3a9c2e'],
    ])('leaves %s an ordinary link, whole, with the words around it', (_, address) => {
      mountBubble({ ...THEIRS, body: `Schau mal: ${address}` })

      expect(card().exists()).toBe(false)
      const link = wrapper.find('.chat-message-text a')
      expect(link.text()).toBe(address)
      expect(link.attributes('href')).toBe(address)
      expect(text().text()).toBe(`Schau mal: ${address}`)
    })

    // A video invitation is somebody else's link here: it stays as V4a built it.
    it('leaves a video invitation as it was', () => {
      const room = 'https://meet.ffmuc.net/k7m2x9q4t8wz'
      const address = `${room}#config.subject=%22Videoanruf%22`
      mountBubble({ ...OWN, body: `📹 Videoanruf\nDer Raum: ${address}` })

      expect(card().exists()).toBe(false)
      expect(wrapper.find('.chat-message-text a').text()).toBe(room)
      expect(wrapper.find('.chat-message-text a').attributes('href')).toBe(address)
    })

    // ⛔ The words around the card come from the other side of the conversation: they stay text.
    it('sets nothing as markup, beside the card as elsewhere', () => {
      mountBubble({ ...THEIRS, body: `<img src=x onerror=alert(1)> ${LINK} <b>fett</b>` })

      expect(text().find('img').exists()).toBe(false)
      expect(text().find('b').exists()).toBe(false)
      expect(pieces()).toEqual(['<img src=x onerror=alert(1)>', '<chat-file-card>', '<b>fett</b>'])
    })

    /**
     * ⛔ Nothing is asked of SwissTransfer before somebody taps the card: no request, no preview
     * picture -- a request would tell a third party that the message was opened (Notiz 23.09. §5).
     */
    it('asks SwissTransfer nothing: no request, no picture', () => {
      const fetched = vi.fn()
      vi.stubGlobal('fetch', fetched)
      const opened = vi.spyOn(XMLHttpRequest.prototype, 'open')
      try {
        mountBubble({ ...THEIRS, body: `Hier ist die Datei:\n${LINK}` })

        expect(card().exists()).toBe(true)
        expect(fetched).not.toHaveBeenCalled()
        expect(opened).not.toHaveBeenCalled()
        expect(card().findAll('img')).toHaveLength(0)
        expect(card().attributes('style')).toBeUndefined()
      } finally {
        vi.unstubAllGlobals()
        opened.mockRestore()
      }
    })
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

  /**
   * V5b (Bernd, 27.09.2026): a planned video call is offered to the member's calendar -- on
   * either side of the conversation, the time out of the invitation's own address, the calendar
   * showing it in this member's time zone.
   */
  describe('a planned video call', () => {
    const ROOM = 'https://meet.systemli.org/q2w3e4r5t6y7'
    const START = new Date('2026-09-30T13:00:00.000Z')
    const END = new Date('2026-09-30T14:00:00.000Z')
    const PLANNED = withChatVideoTopic(ROOM, 'Projektbesprechung', { start: START, end: END })
    const INVITATION = `📹 Videoanruf: Projektbesprechung\n📅 Mittwoch, 30. September 2026\n🕒 15:00–16:00 Uhr (MESZ)\nDer Raum liegt auf einem Jitsi-Server von Systemli — ein Vorschlag, kein Dienst von Gradido: ${PLANNED}`
    const calendar = () => wrapper.find('[data-test="chat-bubble-calendar"]')

    let blobs
    let saved
    afterEach(() => {
      delete URL.createObjectURL
      delete URL.revokeObjectURL
      vi.restoreAllMocks()
    })

    const lendObjectAddresses = () => {
      blobs = []
      saved = []
      URL.createObjectURL = (blob) => {
        blobs.push(blob)
        return 'blob:calendar'
      }
      URL.revokeObjectURL = vi.fn()
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
        saved.push(this.download)
      })
    }

    const text = (blob) =>
      new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsText(blob)
      })

    it.each([
      ['one’s own', true],
      ['the other person’s', false],
    ])('offers it to the calendar under %s invitation', (_, mine) => {
      mountBubble({ ...(mine ? OWN : THEIRS), body: INVITATION })

      expect(calendar().exists()).toBe(true)
      expect(calendar().element.tagName).toBe('BUTTON')
      expect(calendar().attributes('type')).toBe('button')
      expect(calendar().text()).toBe('chatThread.videoAddToCalendar')
    })

    it('offers nothing under a call now, or under any other message', () => {
      for (const body of [
        `📹 Videoanruf. Der Raum liegt …: ${withChatVideoTopic(ROOM, 'Videoanruf')}`,
        'Hättest Du noch Rosmarin übrig?',
        `Schau mal: ${ROOM}`,
      ]) {
        mountBubble({ ...THEIRS, body })
        expect(calendar().exists(), body).toBe(false)
        wrapper.unmount()
      }
      wrapper = null
    })

    it('saves the call: its time, the topic and the other person as its title, the message as its note', async () => {
      lendObjectAddresses()
      mountBubble({ ...THEIRS, body: INVITATION }, 'Lena')

      await calendar().trigger('click')

      expect(saved).toEqual(['Projektbesprechung-2026-09-30.ics'])
      const file = (await text(blobs[0])).replace(/\r\n /g, '')
      expect(file).toContain('DTSTART:20260930T130000Z\r\n')
      expect(file).toContain('DTEND:20260930T140000Z\r\n')
      expect(file).toContain('SUMMARY:Projektbesprechung – Lena\r\n')
      expect(file).toContain(`URL:${PLANNED}\r\n`)
      expect(file).toContain('UID:q2w3e4r5t6y7-1790773200@gradido\r\n')
      expect(file).toContain('DESCRIPTION:📹 Videoanruf: Projektbesprechung\\n📅 Mittwoch')
    })

    it('draws the button with a focus ring of its own, in the stylesheet', () => {
      const code = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
      expect(code).toMatch(/\.chat-bubble-calendar-add:focus-visible\s*\{[^}]*outline:\s*2px solid/)
      expect(code).toMatch(/\.chat-bubble-calendar-add\s*\{[^}]*min-height:\s*2rem/)
    })
  })
})
