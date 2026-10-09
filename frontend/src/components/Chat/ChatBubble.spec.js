// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import ChatBubble from './ChatBubble.vue'
import { forgetAllChatImages, rememberChatImage } from '@/composables/useChatImages'
import { CHAT_VIDEO_JOIN } from '@/utils/chatVideoApp'
import { CHAT_SEARCH } from '@/utils/chatSearch'
import { withChatVideoTopic } from '@/utils/chatVideoTopic'
import { LIST_AVATAR_SIZE } from '@/constants'

/**
 * The client a picture is asked for with (ChatBubbleImage, useChatImages): each question waits for
 * the answer a test gives it.
 */
const pictureServer = vi.hoisted(() => ({ asked: [] }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: {
      query: (options) => new Promise((resolve) => pictureServer.asked.push({ options, resolve })),
    },
  }),
}))

// The face beside somebody else's message in a group (P5) can open large (useAvatarZoom), and its
// words come from the app's i18n instance.
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date, format) => `${format}(${date.toISOString()})`,
  }),
}))

// The copy button behind a video link says what became of the copy (ChatVideoLinkCopy).
const toasts = vi.hoisted(() => ({ success: [], error: [] }))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: (message) => toasts.success.push(message),
    toastError: (message) => toasts.error.push(message),
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
          IMdiContentDuplicate: true,
          IMdiFileDocumentOutline: true,
          IMdiOpenInNew: true,
          IBiCopy: true,
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
   * E-058 (Bernd, 30.09.2026): under every video invitation "Duplizieren" -- the same room and topic
   * in the question before a call, a planned one a week on; for everybody in the conversation.
   */
  describe('"Duplizieren" under a video invitation', () => {
    const ROOM = 'https://meet.systemli.org/q2w3e4r5t6y7'
    const duplicate = () => wrapper.find('[data-test="chat-bubble-duplicate"]')

    it.each([
      ['the other person', THEIRS],
      ['oneself', OWN],
    ])(
      "stands under a call's invitation of %s's, and hands the invitation on",
      async (who, base) => {
        const address = withChatVideoTopic(ROOM, 'Stammtisch')
        mountBubble({ ...base, body: `📹 Videoanruf: Stammtisch\nDer Raum: ${address}` })

        expect(duplicate().text()).toBe('chatThread.videoDuplicate')
        expect(duplicate().attributes('aria-label')).toBe(
          'chatThread.videoDuplicateLabel {"topic":"Stammtisch"}',
        )
        await duplicate().trigger('click')
        expect(wrapper.emitted('duplicateVideo')).toEqual([
          [{ url: address, room: ROOM, topic: 'Stammtisch', start: null, end: null }],
        ])
      },
    )

    it('stands beside "In den Kalender" under a planned call, with its time', async () => {
      const start = new Date('2026-09-30T13:00:00.000Z')
      const end = new Date('2026-09-30T14:00:00.000Z')
      const planned = withChatVideoTopic(ROOM, 'Lesekreis', { start, end })
      mountBubble({ ...THEIRS, body: `Morgen: ${planned}` })

      const buttons = wrapper
        .findAll('.chat-bubble-calendar button')
        .map((b) => b.attributes('data-test'))
      expect(buttons).toEqual(['chat-bubble-calendar', 'chat-bubble-duplicate'])
      await duplicate().trigger('click')
      expect(wrapper.emitted('duplicateVideo')[0][0]).toMatchObject({
        room: ROOM,
        topic: 'Lesekreis',
        start,
        end,
      })
    })

    it.each([
      ['an ordinary message', 'Hallo'],
      ['a room without a topic', `Hier: ${ROOM}`],
      [
        'a room with settings of somebody else',
        `Hier: ${ROOM}#config.subject=x&config.startWithAudioMuted=true`,
      ],
    ])('stands under no other message: %s', (what, body) => {
      mountBubble({ ...THEIRS, body })
      expect(duplicate().exists()).toBe(false)
      expect(wrapper.find('.chat-bubble-calendar').exists()).toBe(false)
    })

    // A transfer's words are the booking's memo: no invitation, whatever they say.
    it('stands under no transfer', () => {
      mountBubble({
        ...THEIRS,
        transfer: true,
        subject: 'Lena hat Dir 10 gesendet',
        body: `Danke! ${withChatVideoTopic(ROOM, 'Stammtisch')}`,
      })
      expect(duplicate().exists()).toBe(false)
    })
  })

  /**
   * E-057 (Bernd, 30.09.2026): the search in the thread marks its hits where they stand -- in the
   * words, the bold runs, a link's text, the subject, a transfer's memo. The thread provides the
   * needle (useChatThreadSearch); here a stand-in does.
   */
  describe('the hits of the search in the thread', () => {
    const mountSearched = (message, needle = 'bank') => {
      wrapper = mount(ChatBubble, {
        props: { message, alias: 'Lena' },
        global: {
          provide: { [CHAT_SEARCH]: ref(needle) },
          stubs: { IMdiEmailOutline: true, IBiCopy: true, IMdiFileDocumentOutline: true },
        },
      })
      return wrapper
    }
    const marks = () => wrapper.findAll('mark.chat-search-mark').map((m) => m.text())

    it('marks every place in the words, keeping the words as they are', () => {
      mountSearched({ ...THEIRS, body: 'Die Bank am Waldrand, eine schöne bank.' })
      expect(marks()).toEqual(['Bank', 'bank'])
      expect(wrapper.find('.chat-message-text').text()).toBe(
        'Die Bank am Waldrand, eine schöne bank.',
      )
    })

    it('marks in bold runs, in a link and in the subject', () => {
      mountSearched({
        ...THEIRS,
        subject: 'Die Bank',
        body: 'Das ist **die Bank** unter https://bank.example.org/weg',
      })
      expect(wrapper.find('[data-test="chat-bubble-subject"] mark').text()).toBe('Bank')
      expect(wrapper.find('.chat-message-text strong mark').text()).toBe('Bank')
      expect(wrapper.find('.chat-message-text a mark').text()).toBe('bank')
      expect(wrapper.find('.chat-message-text a').attributes('href')).toBe(
        'https://bank.example.org/weg',
      )
    })

    it("marks a transfer's memo", () => {
      mountSearched({
        ...THEIRS,
        transfer: true,
        subject: 'Lena hat Dir 10 gesendet',
        body: 'Für die Bank',
      })
      expect(wrapper.find('.memo-text mark').text()).toBe('Bank')
    })

    // Folded as the search compares: the mark stands on the letters as written.
    it('marks without regard to case and accents', () => {
      mountSearched({ ...THEIRS, body: 'Treffen im CAFÉ' }, 'cafe')
      expect(marks()).toEqual(['CAFÉ'])
    })

    it('marks nothing while nothing is searched, nor outside a thread', () => {
      mountSearched({ ...THEIRS, body: 'Die Bank' }, '')
      expect(marks()).toEqual([])
      wrapper.unmount()
      mountBubble({ ...THEIRS, body: 'Die Bank' })
      expect(marks()).toEqual([])
    })

    it('rings the bubble the search stands on', () => {
      wrapper = mount(ChatBubble, {
        props: { message: { ...THEIRS, body: 'Die Bank' }, alias: 'Lena', searchCurrent: true },
        global: { provide: { [CHAT_SEARCH]: ref('bank') }, stubs: { IMdiEmailOutline: true } },
      })
      expect(bubble().classes()).toContain('is-search-current')
      wrapper.unmount()
      mountSearched({ ...THEIRS, body: 'Die Bank' })
      expect(bubble().classes()).not.toContain('is-search-current')
    })
  })

  /**
   * Bernd, 29.09.2026: behind a video room's link a button copies it -- to hand the room on to
   * another chat, or to meet there again -- for everybody who reads the message, the room with its
   * topic and without a planned call's time (ChatVideoLinkCopy).
   */
  describe('the copy button behind a video link', () => {
    const ROOM = 'https://meet.opensuse.org/zsuhu82kdvs1'
    const ADDRESS = withChatVideoTopic(ROOM, 'Neue Funktionen')
    const INVITATION = `📹 Videoanruf: Neue Funktionen\nDer Raum liegt auf einem Jitsi-Server von openSUSE Project — ein Vorschlag, kein Dienst von Gradido: ${ADDRESS}`
    const buttons = () => wrapper.findAll('[data-test="chat-video-link-copy"]')

    afterEach(() => {
      vi.unstubAllGlobals()
      toasts.success.length = 0
      toasts.error.length = 0
    })

    it.each([
      ['the other person', THEIRS],
      ['oneself', OWN],
    ])("stands right behind the link in a message of %s's", (who, message) => {
      mountBubble({ ...message, body: INVITATION })

      expect(buttons()).toHaveLength(1)
      const link = wrapper.find('.chat-message-text a')
      expect(link.element.nextElementSibling).toBe(buttons()[0].element)
      // The link keeps room for it at its end (ChatVideoLinkCopy).
      expect(link.classes()).toContain('chat-video-link')
      expect(link.text()).toBe(ROOM)
    })

    it('copies the room with its topic', async () => {
      const writeText = vi.fn().mockResolvedValue()
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      mountBubble({ ...THEIRS, body: INVITATION })

      await buttons()[0].trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(ADDRESS)
      expect(toasts.success).toEqual(['chatThread.videoLinkCopied'])
    })

    // Bernd's choice: a link used again for another meeting brings no old date along.
    it("copies a planned call's room without its time", async () => {
      const writeText = vi.fn().mockResolvedValue()
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      const when = {
        start: new Date('2026-09-30T13:00:00.000Z'),
        end: new Date('2026-09-30T14:00:00.000Z'),
      }
      mountBubble({ ...OWN, body: `Morgen: ${withChatVideoTopic(ROOM, 'Lesekreis', when)}` })

      await buttons()[0].trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(withChatVideoTopic(ROOM, 'Lesekreis'))
    })

    it('stands behind each video link, and each copies its own', async () => {
      const writeText = vi.fn().mockResolvedValue()
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      const other = withChatVideoTopic('https://meet.ffmuc.net/k7m2x9q4t8wz', 'Zweiter Raum')
      mountBubble({ ...THEIRS, body: `Entweder ${ADDRESS} oder ${other}` })

      expect(buttons()).toHaveLength(2)
      await buttons()[1].trigger('click')
      await flushPromises()
      expect(writeText).toHaveBeenCalledWith(other)
    })

    // What the thread shows whole is copied as any link is: nothing behind it, and no room kept.
    it.each([
      ['an ordinary address', 'Schau mal: https://gradido.net/de/faq#konto'],
      [
        'a video room with settings of somebody else',
        `Hier: ${ROOM}#config.subject=x&config.startWithAudioMuted=true`,
      ],
      ['a room without a topic', `Hier: ${ROOM}`],
      [
        'a file card',
        'Die Fotos: https://www.swisstransfer.com/d/0b7f3c2a-1234-4cde-9f00-abcdef123456',
      ],
      ['an e-mail address', 'Schreib an bernd@example.org'],
    ])('stands behind no other address: %s', (what, body) => {
      mountBubble({ ...THEIRS, body })

      expect(buttons()).toHaveLength(0)
      expect(wrapper.find('.chat-video-link').exists()).toBe(false)
    })
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
          stubs: { IMdiEmailOutline: true, IBiCopy: true },
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

  /**
   * E-060 B3 (Bernd, 01.10.2026): a message whose writer changed it says so -- the word, before
   * the time, for everybody who reads it. The earlier text is not kept, and nothing says what it
   * was or when it was changed.
   */
  describe('the word "bearbeitet"', () => {
    const mark = () => wrapper.find('[data-test="chat-bubble-edited"]')

    it.each([
      ['one’s own', OWN],
      ['the other person’s', THEIRS],
    ])('stands before the time of %s message that was changed', (_, message) => {
      mountBubble({ ...message, editedAt: '2026-09-22T15:00:00.000Z' })

      expect(mark().text()).toBe('chatThread.edited')
      // Before the time, in the line the time stands in -- and the time is still when it arrived.
      const time = wrapper.find('[data-test="chat-bubble-time"]')
      expect(mark().element.parentElement).toBe(time.element.parentElement)
      expect(
        mark().element.compareDocumentPosition(time.element) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(time.attributes('datetime')).toBe(message.createdAt)
      // The word only: not when it was changed.
      expect(wrapper.text()).not.toContain('15:00')
    })

    it('stands at no message nobody changed', () => {
      mountBubble({ ...OWN, editedAt: null })
      expect(mark().exists()).toBe(false)
      wrapper.unmount()

      // A message from before the field.
      mountBubble(OWN)
      expect(mark().exists()).toBe(false)
    })

    // The dot between the word and the time is drawn, not read out; the word is quiet, as the time.
    it('is set apart from the time by a dot in the stylesheet', () => {
      const code = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
      expect(code).toMatch(/\.chat-bubble-edited::after\s*\{[^}]*content:\s*'·'/)
      expect(code).not.toMatch(/\.chat-bubble-edited\s*\{[^}]*color:/)
    })
  })

  /**
   * The quotation over an answer (Bernd, 09.10.2026). The thread's spec holds it with a thread
   * around it; here what the bubble decides by itself.
   */
  describe('the quotation over an answer', () => {
    const QUOTED = {
      id: 4,
      messageUuid: 'uuid-4',
      mine: false,
      excerpt: 'Wann treffen wir uns?',
      hasImage: false,
      senderUser: null,
    }
    const quote = () => wrapper.find('[data-test="chat-bubble-quote"]')
    const quoteName = () => wrapper.find('[data-test="chat-bubble-quote-name"]')
    const quoteText = () => wrapper.find('[data-test="chat-bubble-quote-text"]')

    it('hands the quoted message up when it is pressed', async () => {
      mountBubble({ ...OWN, replyTo: QUOTED })

      await quote().trigger('click')

      expect(wrapper.emitted('showQuoted')).toEqual([[QUOTED]])
    })

    // In a group the server names the writer with the quotation, as with a group's message.
    it('names the writer the server named, in a group', () => {
      mountBubble({
        ...OWN,
        replyTo: {
          ...QUOTED,
          senderUser: { communityUuid: 'home-uuid', gradidoID: 'carla-id', alias: 'Carla-Sonne' },
        },
      })

      expect(quoteName().text()).toBe('Carla-Sonne')
    })

    it('names the other person between two, and "Du" for one’s own', () => {
      mountBubble({ ...OWN, replyTo: QUOTED })
      expect(quoteName().text()).toBe('Lena')
      wrapper.unmount()

      mountBubble({ ...THEIRS, replyTo: { ...QUOTED, mine: true } })
      expect(quoteName().text()).toBe('chatThread.you')
    })

    // The message as the thread holds it goes before what the server sent with the answer.
    it('quotes the message handed in by the thread before the server’s words', async () => {
      mountBubble({ ...OWN, replyTo: QUOTED })
      expect(quoteText().text()).toBe('Wann treffen wir uns?')

      await wrapper.setProps({ quotedMessage: { id: 4, body: 'Um  elf\nam Markt', images: [] } })

      expect(quoteText().text()).toBe('Um elf am Markt')
    })

    it('is ringed while the bar answers it, and while a quotation led to it', async () => {
      mountBubble(THEIRS)
      expect(wrapper.classes()).not.toContain('is-answered')
      expect(wrapper.classes()).not.toContain('is-shown')

      await wrapper.setProps({ answering: true })
      expect(wrapper.classes()).toContain('is-answered')
      await wrapper.setProps({ answering: false, shown: true })
      expect(wrapper.classes()).toContain('is-shown')
      expect(wrapper.classes()).not.toContain('is-answered')

      const code = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
      for (const mark of ['is-answered', 'is-shown']) {
        expect(code).toMatch(
          new RegExp(
            `\\.chat-bubble-row\\.${mark} \\.chat-bubble[\\s,][^}]*box-shadow:\\s*0 0 0 2px var\\(--success`,
          ),
        )
      }
    })

    /**
     * ⛔ Cut off to one line by a line clamp, not by `nowrap`: a line that may not break asks for
     * its whole width, through every box around it (skill null-ac).
     */
    it('keeps the name and the words to one line each without forbidding them to break', () => {
      const code = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
      const rule = code.match(
        /\.chat-bubble-quote-name,\s*\.chat-bubble-quote-text\s*\{([^}]*)\}/,
      )?.[1]
      expect(rule).toMatch(/-webkit-line-clamp:\s*1/)
      expect(rule).toMatch(/overflow:\s*hidden/)
      expect(code.match(/\.chat-bubble-quote[^{]*\{[^}]*white-space:\s*nowrap/)).toBeNull()
    })
  })

  // E-060: the message whose text stands in the bar to be changed is ringed, as under its menu.
  it('is ringed while its text is being changed', async () => {
    mountBubble(OWN)
    expect(wrapper.classes()).not.toContain('is-editing')

    await wrapper.setProps({ editing: true })

    expect(wrapper.classes()).toContain('is-editing')
    const code = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '')
    expect(code).toMatch(
      /\.chat-bubble-row\.is-editing \.chat-bubble\s*\{[^}]*box-shadow:\s*0 0 0 2px var\(--success/,
    )
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

    /**
     * E-060: a planned call that was changed. Its file keeps the name the call had FIRST -- its
     * room and its first start -- and counts its changes, so a calendar that holds the call moves
     * the entry it has instead of adding a second one.
     */
    it('saves a changed call under the name of its first start, with the count of its changes', async () => {
      lendObjectAddresses()
      const moved = {
        start: new Date('2026-10-05T14:00:00.000Z'),
        end: new Date('2026-10-05T15:00:00.000Z'),
      }
      const address = withChatVideoTopic(ROOM, 'Projektbesprechung', moved, {
        first: START,
        sequence: 2,
      })
      mountBubble({
        ...THEIRS,
        body: `📹 Videoanruf: Projektbesprechung\n📅 Montag, 5. Oktober 2026\n🕒 16:00–17:00 Uhr (MESZ)\nDer Raum liegt …: ${address}`,
        editedAt: '2026-09-29T08:00:00.000Z',
      })

      await calendar().trigger('click')

      const file = (await text(blobs[0])).replace(/\r\n /g, '')
      // The same name as before the change (see the test above), the new time, the count.
      expect(file).toContain('UID:q2w3e4r5t6y7-1790773200@gradido\r\n')
      expect(file).toContain('SEQUENCE:2\r\n')
      expect(file).toContain('DTSTART:20261005T140000Z\r\n')
      expect(file).toContain('DTEND:20261005T150000Z\r\n')
      expect(file).toContain(`URL:${address}\r\n`)
    })

    // Gegenprobe: a call never changed counts nothing and is named by its own start.
    it('saves a call never changed with no change counted', async () => {
      lendObjectAddresses()
      mountBubble({ ...THEIRS, body: INVITATION })

      await calendar().trigger('click')

      const file = (await text(blobs[0])).replace(/\r\n /g, '')
      expect(file).toContain('SEQUENCE:0\r\n')
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

  /**
   * P7: a message with a picture (E-044 F3/F5; the mockup, "Bilder im Faden"). The picture on top,
   * in the room its size gives it before it has come; its caption under it in the same bubble; a
   * tap opens it large.
   */
  /**
   * A transfer between the two (ChatThread, Bernd, 28.09.2026): "formatiert wie eine E-Mail, nur
   * etwas kürzer" -- the mail's words bold behind the coin, the booking's memo under them, on the
   * side of whoever sent it.
   */
  describe('a transfer', () => {
    const TRANSFER = {
      key: 'transfer-12',
      transfer: true,
      mine: false,
      createdAt: '2026-09-28T07:41:00.000Z',
      subject: 'Lena hat Dir 10,00 Gradido gesendet',
      body: 'Danke für den **Rosmarin**: https://x.org/rezept',
    }

    it('shows the mail’s words bold behind the coin, and the memo under them', () => {
      mountBubble(TRANSFER)
      const row = wrapper.find('[data-test="chat-bubble"]')
      expect(row.classes()).toEqual(
        expect.arrayContaining(['chat-bubble-transfer', 'chat-bubble-theirs']),
      )
      const head = wrapper.find('[data-test="chat-bubble-subject"]')
      expect(head.classes()).toContain('chat-bubble-transfer-head')
      expect(head.text()).toBe('Lena hat Dir 10,00 Gradido gesendet')
      const coin = head.find('svg.chat-transfer-coin')
      expect(coin.attributes('aria-hidden')).toBe('true')
      expect(coin.html()).toContain('currentColor')
      expect(wrapper.find('[data-test="chat-bubble-time"]').text()).toBe(
        'time(2026-09-28T07:41:00.000Z)',
      )
    })

    // The booking's text as the booking list shows it: its address a link, its stars stars.
    it('shows the memo as the booking list does, not as a chat message', () => {
      mountBubble(TRANSFER)
      const memo = wrapper.find('.chat-bubble-text')
      expect(memo.classes()).toContain('memo-text')
      expect(memo.text()).toBe('Danke für den **Rosmarin**: https://x.org/rezept')
      expect(memo.find('a').attributes('href')).toBe('https://x.org/rezept')
      expect(memo.find('strong').exists()).toBe(false)
      expect(wrapper.find('.chat-message-text').exists()).toBe(false)
    })

    it('stands on one’s own side where one sent it, without a word about a mail', () => {
      mountBubble({ ...TRANSFER, mine: true, subject: 'Du hast Lena 10,00 Gradido gesendet' })
      expect(wrapper.find('[data-test="chat-bubble"]').classes()).toContain('chat-bubble-mine')
      expect(wrapper.find('[data-test="chat-bubble-writer"]').text()).toBe('chatThread.you:')
      expect(wrapper.find('[data-test="envelope"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="chat-bubble-state"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="chat-bubble-not-mailed"]').exists()).toBe(false)
    })

    it('keeps an ordinary message as it was: no coin, its own text', () => {
      mountBubble({ ...OWN, subject: 'Samstag' })
      expect(wrapper.find('[data-test="chat-bubble"]').classes()).not.toContain(
        'chat-bubble-transfer',
      )
      expect(wrapper.find('svg.chat-transfer-coin').exists()).toBe(false)
      expect(wrapper.find('.chat-message-text').exists()).toBe(true)
    })

    it('puts the coin on the first line of the words, in the stylesheet', () => {
      const code = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
      expect(code).toMatch(
        /\.chat-bubble-transfer-head\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*flex-start/,
      )
      expect(code).toMatch(/\.chat-transfer-coin\s*\{[^}]*width:\s*1\.35em;[^}]*height:\s*1\.35em/)
    })
  })

  describe('a message with a picture', () => {
    const PICTURE = { imageUuid: 'image-7', width: 800, height: 600 }
    const WITH = { ...THEIRS, body: 'So sieht unser Stand aus.', images: [PICTURE] }

    const button = () => wrapper.find('[data-test="chat-bubble-image"]')
    const picture = () => wrapper.find('[data-test="chat-bubble-image-picture"]')
    const missing = () => wrapper.find('[data-test="chat-bubble-image-missing"]')
    const answer = async (index, base64) => {
      pictureServer.asked[index].resolve({ data: { chatMessageImage: base64 } })
      await flushPromises()
    }

    const OriginalObserver = globalThis.IntersectionObserver
    beforeEach(() => {
      pictureServer.asked = []
      URL.createObjectURL = vi.fn(() => 'blob:the-picture')
      URL.revokeObjectURL = vi.fn()
    })
    afterEach(() => {
      forgetAllChatImages()
      delete URL.createObjectURL
      delete URL.revokeObjectURL
      globalThis.IntersectionObserver = OriginalObserver
    })

    /**
     * ⛔ The room before the picture: its width and height from the message, as attributes and as
     * proportions -- nothing below jumps when it comes. Until then a quiet surface, no spinner.
     */
    it('keeps the picture’s room before it has come, on a quiet surface', () => {
      mountBubble(WITH)

      expect(picture().attributes('width')).toBe('800')
      expect(picture().attributes('height')).toBe('600')
      expect(picture().attributes('style')).toContain('aspect-ratio: 800 / 600')
      expect(picture().attributes('src')).toBeUndefined()
      expect(picture().classes()).toContain('is-waiting')
      expect(wrapper.find('.spinner-border').exists()).toBe(false)
    })

    it('shows the picture once it has come', async () => {
      mountBubble(WITH)
      expect(pictureServer.asked).toHaveLength(1)
      expect(pictureServer.asked[0].options.variables).toEqual({ imageUuid: 'image-7' })

      await answer(0, btoa('JPEG'))

      expect(picture().attributes('src')).toBe('blob:the-picture')
      expect(picture().classes()).not.toContain('is-waiting')
    })

    // The server gave nothing -- not there, not for this member, not any more.
    it('says "Bild nicht verfügbar" where no picture comes, in the room it would have had', async () => {
      mountBubble(WITH)

      await answer(0, null)

      expect(button().exists()).toBe(false)
      expect(missing().text()).toBe('chatThread.imageMissing')
      expect(missing().attributes('style')).toContain('aspect-ratio: 800 / 600')
      // The caption stays.
      expect(wrapper.find('.chat-message-text').text()).toBe('So sieht unser Stand aus.')
    })

    // E-044 F3: the caption under the picture, in the same bubble -- as any text, with its links.
    it('puts the caption under the picture, in the same bubble, as any text', () => {
      mountBubble({ ...WITH, body: 'Der Stand: https://ki-playground.gradido.net/u/Lena' })

      const inside = wrapper.find('.chat-bubble')
      expect(inside.classes()).toContain('has-image')
      const text = inside.find('.chat-message-text')
      expect(
        button().element.compareDocumentPosition(text.element) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(text.find('a').attributes('href')).toBe('https://ki-playground.gradido.net/u/Lena')
    })

    it('has no caption where the picture came without words', () => {
      mountBubble({ ...WITH, body: '' })

      expect(button().exists()).toBe(true)
      expect(wrapper.find('.chat-message-text').exists()).toBe(false)
    })

    // Gegenprobe: a message without a picture is the bubble it always was.
    it('leaves a message without a picture as it was', () => {
      mountBubble(THEIRS)
      expect(wrapper.find('.chat-bubble').classes()).not.toContain('has-image')
      expect(button().exists()).toBe(false)
      mountBubble({ ...THEIRS, images: [] })
      expect(button().exists()).toBe(false)
      expect(pictureServer.asked).toEqual([])
    })

    // A tap asks for it large: the thread opens the view, and gets the button for the focus.
    it('asks for the picture large on a tap, with the button that was pressed', async () => {
      mountBubble(WITH)

      await button().trigger('click')

      expect(wrapper.emitted('openImage')).toEqual([
        [{ message: WITH, image: PICTURE, opener: button().element }],
      ])
    })

    it('is a button that says what it does', () => {
      mountBubble(WITH)

      expect(button().element.tagName).toBe('BUTTON')
      expect(button().attributes('type')).toBe('button')
      expect(button().attributes('aria-label')).toBe('chatThread.imageOpen')
      expect(button().attributes('title')).toBe('chatThread.imageOpen')
      expect(picture().attributes('alt')).toBe('')
    })

    // One's own picture, just sent, is here already (ChatThread keeps it from the JPEG).
    it('asks nothing for a picture that is here already', () => {
      rememberChatImage('image-7', btoa('JPEG'))

      mountBubble({ ...WITH, mine: true })

      expect(pictureServer.asked).toEqual([])
      expect(picture().attributes('src')).toBe('blob:the-picture')
    })

    /**
     * Only the bubbles in sight fetch their picture: a long thread opened at its end does not ask
     * for the pictures of its beginning. Without an IntersectionObserver, when it is drawn (above).
     */
    it('asks for the picture once its bubble is in sight', async () => {
      const observers = []
      globalThis.IntersectionObserver = class {
        constructor(callback) {
          this.callback = callback
          this.observed = []
          this.disconnect = vi.fn()
          observers.push(this)
        }

        observe(element) {
          this.observed.push(element)
        }
      }
      mountBubble(WITH)

      expect(pictureServer.asked).toEqual([])
      expect(observers[0].observed).toEqual([button().element])

      observers[0].callback([{ isIntersecting: false }])
      expect(pictureServer.asked).toEqual([])

      observers[0].callback([{ isIntersecting: true }])
      expect(pictureServer.asked).toHaveLength(1)
      expect(observers[0].disconnect).toHaveBeenCalled()

      wrapper.unmount()
      wrapper = null
    })

    it('stops watching when the bubble goes before its picture was asked for', () => {
      const disconnect = vi.fn()
      globalThis.IntersectionObserver = class {
        observe() {}

        disconnect() {
          disconnect()
        }
      }
      mountBubble(WITH)

      wrapper.unmount()
      wrapper = null

      expect(disconnect).toHaveBeenCalled()
      expect(pictureServer.asked).toEqual([])
    })

    const style = (file) =>
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )
    const rule = (code, selector) =>
      code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    /**
     * What only the stylesheet holds (jsdom lays nothing out): the bubble 16.5rem wide and never
     * more than 80 %, little room around the picture; the picture as wide as the bubble, at most
     * 22rem high, cut at the bottom with its top in sight (E-044 F5).
     */
    it('draws the bubble and the picture as the mockup has them', () => {
      const bubbleCode = style('ChatBubble.vue')
      expect(rule(bubbleCode, '\\.chat-bubble\\.has-image')).toMatch(/width:\s*16\.5rem/)
      expect(rule(bubbleCode, '\\.chat-bubble\\.has-image')).toMatch(/padding:\s*0\.25rem/)
      expect(rule(bubbleCode, '\\.chat-bubble')).toMatch(/max-width:\s*80%/)

      const pictureCode = style('ChatBubbleImage.vue')
      const img = rule(pictureCode, '\\.chat-bubble-image-picture')
      expect(img).toMatch(/width:\s*100%/)
      expect(img).toMatch(/max-height:\s*22rem/)
      expect(img).toMatch(/object-fit:\s*cover/)
      expect(img).toMatch(/object-position:\s*top/)
      expect(rule(pictureCode, '\\.chat-bubble-image:focus-visible')).toMatch(
        /outline:\s*2px solid/,
      )
    })
  })

  /**
   * In a group (P5) the side no longer says who wrote a message: somebody else's has their face
   * at its left and their name over it -- over the first of a run of theirs -- and an announcement
   * is marked for everybody (E-050 F5).
   */
  describe('in a group', () => {
    const CARLA = {
      communityUuid: 'home-uuid',
      gradidoID: 'carla-id',
      alias: 'Carla-Sonne',
      avatarColorIndex: 3,
      avatarUpdatedAt: null,
    }
    const GROUP_THEIRS = {
      ...THEIRS,
      conversationId: 41,
      groupUuid: 'cafe-uuid',
      sender: { communityUuid: 'home-uuid', gradidoID: 'carla-id' },
      senderUser: CARLA,
      announcement: false,
    }
    const GROUP_OWN = {
      ...OWN,
      conversationId: 41,
      groupUuid: 'cafe-uuid',
      senderUser: { ...CARLA, gradidoID: 'me-id', alias: 'Bernd' },
      announcement: false,
    }

    const mountInGroup = (message, { showWriter = true } = {}) => {
      wrapper = mount(ChatBubble, {
        props: { message, alias: 'Gradido-Café Berlin', inGroup: true, showWriter },
        global: {
          stubs: {
            IMdiEmailOutline: { template: '<i data-test="envelope" />' },
            IMdiCalendarPlusOutline: true,
          },
        },
      })
      return wrapper
    }
    const face = () => wrapper.find('[data-test="chat-bubble-face"]')
    const name = () => wrapper.find('[data-test="chat-bubble-group-writer"]')

    // Bernd, 29.09.2026: "48 px wie jede Liste" -- the face of every list, and the bubbles stand
    // in by as much.
    it("shows the writer's face, at the size of every list, and name over somebody else's message", () => {
      mountInGroup(GROUP_THEIRS)
      expect(face().exists()).toBe(true)
      expect(face().text()).toBe('CA')
      expect(face().attributes('style')).toContain(`width: ${LIST_AVATAR_SIZE}px`)
      expect(LIST_AVATAR_SIZE).toBe(48)
      expect(name().text()).toBe('Carla-Sonne')
      expect(bubble().classes()).toContain('chat-bubble-in-group')
      expect(bubble().attributes('style')).toContain(`--chat-bubble-face: ${LIST_AVATAR_SIZE}px`)
    })

    // The ear hears the writer inside the bubble, as in a thread of two -- not the group's name.
    // E-053: the name over their message leads to the writer -- the page decides where. A button,
    // heard as one; so the bubble under it leaves the name out rather than say it twice.
    it('leads to the writer by their name, and names them once for the ear', async () => {
      mountInGroup(GROUP_THEIRS)
      const link = name().find('[data-test="member-name-open"]')
      expect(link.element.tagName).toBe('BUTTON')
      expect(link.text()).toBe('Carla-Sonne')
      expect(name().attributes('aria-hidden')).toBeUndefined()
      expect(wrapper.find('[data-test="chat-bubble-writer"]').exists()).toBe(false)

      await link.trigger('click')
      expect(wrapper.emitted('openMember')).toEqual([[CARLA]])
    })

    // A writer whose users row is gone: the pair the server keeps with the message still leads.
    it('leads by the pair where the server names no user', async () => {
      mountInGroup({ ...GROUP_THEIRS, senderUser: null })
      await name().find('[data-test="member-name-open"]').trigger('click')
      expect(wrapper.emitted('openMember')).toEqual([
        [{ communityUuid: 'home-uuid', gradidoID: 'carla-id' }],
      ])
    })

    it('shows neither further down a run, and keeps the bubble in line', () => {
      mountInGroup(GROUP_THEIRS, { showWriter: false })
      expect(face().exists()).toBe(false)
      expect(name().exists()).toBe(false)
      expect(bubble().classes()).toContain('chat-bubble-in-group')
      expect(wrapper.find('[data-test="chat-bubble-writer"]').text()).toBe('Carla-Sonne:')
    })

    it("shows no face and no name at one's own message", () => {
      mountInGroup(GROUP_OWN)
      expect(face().exists()).toBe(false)
      expect(name().exists()).toBe(false)
      expect(bubble().classes()).not.toContain('chat-bubble-in-group')
      expect(wrapper.find('[data-test="chat-bubble-writer"]').text()).toBe('chatThread.you:')
    })

    // A writer whose users row is gone: the pair stands in, and the name is their id.
    it('names a writer the server could not name by their id', () => {
      mountInGroup({ ...GROUP_THEIRS, senderUser: null })
      expect(name().text()).toBe('carla-id')
      expect(face().exists()).toBe(true)
    })

    it("marks somebody else's announcement, for everybody who reads it", () => {
      mountInGroup({ ...GROUP_THEIRS, announcement: true })
      expect(wrapper.find('[data-test="chat-bubble-announcement"]').text()).toBe(
        'chatGroup.announcement',
      )
      wrapper.unmount()
      mountInGroup(GROUP_THEIRS)
      expect(wrapper.find('[data-test="chat-bubble-announcement"]').exists()).toBe(false)
    })

    // One's own announcement says so at the envelope: what was asked for, never who got it.
    it("says at one's own envelope that it went as an announcement", () => {
      mountInGroup({ ...GROUP_OWN, notify: 'EMAIL', announcement: true })
      const mailed = wrapper.find('[data-test="chat-bubble-mailed"]')
      expect(mailed.attributes('aria-label')).toBe('chatGroup.announced')
      expect(wrapper.find('[data-test="chat-bubble-announcement"]').exists()).toBe(false)
    })

    // Gegenprobe: in a thread of two nothing of it -- no face, no name, the envelope's own word.
    it('draws a message of two as before', () => {
      mountBubble({ ...THEIRS, senderUser: CARLA, announcement: true })
      expect(wrapper.find('[data-test="chat-bubble-face"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="chat-bubble-group-writer"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="chat-bubble-announcement"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="chat-bubble-writer"]').text()).toBe('Lena:')
      wrapper.unmount()
      mountBubble({ ...OWN, notify: 'EMAIL' })
      expect(wrapper.find('[data-test="chat-bubble-mailed"]').attributes('aria-label')).toBe(
        'chatThread.mailed',
      )
    })
  })
})
