// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import ChatThread from './ChatThread.vue'
import ChatBubble from './ChatBubble.vue'
import ChatComposeBar from './ChatComposeBar.vue'
import { chatDraftFor, chatGroupDraftKey, forgetChatDrafts } from '@/utils/chatDraft'
import { editChatMessage } from '@/graphql/chat.graphql'
import {
  chatGroupMessagesQuery,
  markChatGroupRead,
  sendChatGroupMessage,
} from '@/graphql/chatGroups.graphql'
import { transactionsQuery } from '@/graphql/transactions.graphql'
import { holdChatText } from '@/utils/chatReturn'
import { noteChatVideoJoined } from '@/utils/chatVideoJoined'
import { onChatMessageSent } from '@/composables/useChatSent'

/**
 * A group's thread (P5): ChatThread in its group's kind. What it shares with the thread of two --
 * scrolling, older pages, the bar's text -- is ChatThread.spec's; this file holds what differs:
 * what it is asked by, where it sends, who wrote what, and what the box means.
 */

const beat = vi.hoisted(() => ({
  listeners: new Set(),
  editedListeners: new Set(),
  reactedListeners: new Set(),
  pollNow: vi.fn(async () => {}),
}))
vi.mock('@/composables/useChatUpdates', () => ({
  onChatMessages: (listener) => {
    beat.listeners.add(listener)
    return () => beat.listeners.delete(listener)
  },
  onChatMessagesEdited: (listener) => {
    beat.editedListeners.add(listener)
    return () => beat.editedListeners.delete(listener)
  },
  onChatMessagesReacted: (listener) => {
    beat.reactedListeners.add(listener)
    return () => beat.reactedListeners.delete(listener)
  },
  pollChatNow: (...args) => beat.pollNow(...args),
}))
const beatBrings = async (...chatMessages) => {
  for (const listener of [...beat.listeners]) listener(chatMessages)
  await flushPromises()
}
const beatChanges = async (...edited) => {
  for (const listener of [...beat.editedListeners]) listener(edited)
  await flushPromises()
}
const beatReacts = async (...reacted) => {
  for (const listener of [...beat.reactedListeners]) listener(reacted)
  await flushPromises()
}

const storeState = vi.hoisted(() => ({
  gradidoID: 'me-id',
  username: 'Bernd',
  communityUuid: 'home-uuid',
}))
vi.mock('@/store/useWalletStore', () => ({ useWalletStore: () => storeState }))

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values, plural) =>
      typeof plural === 'number'
        ? `${key}:${plural}`
        : values
          ? `${key} ${JSON.stringify(values)}`
          : key,
    d: (date, format) => `${format}(${date.toISOString()})`,
    n: (value, format) => `${format}(${value})`,
    locale: { value: 'de' },
  }),
}))

// The writers' faces are asked for as the lists ask for theirs; what is asked is what counts here.
const facesAsked = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useMemberAvatars', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchMemberAvatars: (...args) => facesAsked(...args),
}))

// What the thread asks of the transfers helper -- in a group: nothing (E-050 F6).
const transfersAsked = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useChatTransfers', async (importOriginal) => {
  const real = await importOriginal()
  return {
    useChatTransfers: (client, member, options) => {
      transfersAsked(member, options)
      return real.useChatTransfers(client, member, options)
    },
  }
})

const imageViews = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useChatImages', async (importOriginal) => ({
  ...(await importOriginal()),
  openChatImageView: (...args) => imageViews(...args),
}))

/**
 * Whether a message is a video invitation word for word (utils/chatVideoInvite): null, as for
 * every ordinary message, unless a test says what it reads -- as ChatThread.spec has it.
 */
const videoInviteRead = vi.hoisted(() => vi.fn(() => null))
vi.mock('@/utils/chatVideoInvite', async (original) => ({
  ...(await original()),
  readChatVideoInvite: (...args) => videoInviteRead(...args),
}))

let server
const markRead = vi.fn(async () => ({ data: { markChatGroupRead: true } }))
const serverSends = vi.fn()
/** What the server answers to `editChatMessage` (E-060), called with the variables and the options. */
const serverChanges = vi.fn()
const asked = vi.fn(async () => {
  throw new Error('no server for this question')
})

/** The cache as the thread uses it: the group's page, keyed by query and variables. */
const cache = {
  updateQuery: ({ query, variables }, change) => {
    if (query !== chatGroupMessagesQuery) return null
    if (JSON.stringify(variables) !== JSON.stringify(server.variables)) return null
    const next = change(server.result.value)
    if (next) server.result.value = next
    return next ?? null
  },
}

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue')
  return {
    useQuery: (document, variables, options) => {
      const result = ref(undefined)
      const error = ref(null)
      const fetchMore = vi.fn(async ({ variables: more, updateQuery }) => {
        const answer = server.olderPages.shift()
        result.value = updateQuery(result.value, {
          fetchMoreResult: { chatGroupMessages: answer },
          variables: { ...variables, ...more },
        })
        return { data: { chatGroupMessages: answer } }
      })
      server = { document, variables, options, result, error, fetchMore, olderPages: [] }
      return { result, error, fetchMore, loading: ref(false) }
    },
    useMutation: (document) => {
      // A change of one's own (E-060): one mutation for both kinds of thread, by the message.
      if (document === editChatMessage) {
        return {
          mutate: async (variables, options) => ({
            data: { editChatMessage: await serverChanges(variables, options) },
          }),
        }
      }
      if (document !== sendChatGroupMessage) {
        return { mutate: (variables, options) => markRead(document, variables, options) }
      }
      return {
        mutate: async (variables, options = {}) => {
          const data = { sendChatGroupMessage: await serverSends(variables) }
          options.update?.(cache, { data })
          return { data }
        },
      }
    },
    useApolloClient: () => ({ client: { cache, query: asked } }),
  }
})

const WRITERS = {
  me: { communityUuid: 'home-uuid', gradidoID: 'me-id', alias: 'Bernd', avatarColorIndex: 1 },
  anna: {
    communityUuid: 'home-uuid',
    gradidoID: 'anna-id',
    alias: 'Anna-Sonne',
    avatarColorIndex: 2,
  },
  carla: {
    communityUuid: 'home-uuid',
    gradidoID: 'carla-id',
    alias: 'Carla-Sonne',
    avatarColorIndex: 3,
  },
}

const GROUP = {
  groupUuid: 'cafe-uuid',
  conversationId: 41,
  title: 'Gradido-Café Berlin',
  communityName: 'Home',
  createdBy: { ...WRITERS.anna },
  createdAt: '2026-09-27T10:00:00.000Z',
  role: 'MEMBER',
  joinedAt: '2026-09-27T10:00:00.000Z',
  mutedByMe: false,
  memberCount: 5,
  unreadMessages: 0,
  lastMessageAt: null,
}

/** A message of the group as the server sends it; `n` is its id and its minute on the day. */
const message = (n, { writer = 'anna', day = '2026-09-29', announcement = false } = {}) => {
  const mine = writer === 'me'
  return {
    id: n,
    messageUuid: `uuid-${n}`,
    conversationId: 41,
    groupUuid: 'cafe-uuid',
    sender: { communityUuid: 'home-uuid', gradidoID: WRITERS[writer].gradidoID },
    senderUser: { ...WRITERS[writer], avatarUpdatedAt: null },
    announcement,
    mine,
    subject: null,
    body: `message ${n}`,
    createdAt: `${day}T10:${String(n % 60).padStart(2, '0')}:00.000Z`,
    deliveryState: mine ? 'DELIVERED' : null,
    notify: mine ? (announcement ? 'EMAIL' : 'NONE') : null,
    mailState: null,
    images: [],
  }
}

const page = (messages, { hasMore = false } = {}) => ({ hasMore, mutedByMe: false, messages })

// What a test leaves in the field waits for the next bar of that conversation (utils/chatDraft) --
// in the wallet, and here for the next test: in memory, and its words on the device. Every test
// begins with none.
afterEach(() => {
  forgetChatDrafts()
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith('chat-drafts:')) window.localStorage.removeItem(key)
  }
})

describe('ChatThread in a group', () => {
  let wrapper

  const mountThread = (group = {}, more = {}) => {
    wrapper = mount(ChatThread, {
      props: { group: { ...GROUP, ...group }, ...more },
      global: {
        stubs: {
          IMdiChatOutline: true,
          IMdiEmailOutline: true,
          IMdiSend: true,
          IMdiPaperclip: true,
          IMdiCellphone: true,
          IMdiOpenInNew: true,
          IMdiDotsHorizontal: true,
          IMdiPencilOutline: true,
          IMdiShareOutline: true,
          IMdiContentCopy: true,
          IMdiCheck: true,
          IMdiClose: true,
          BModal: true,
        },
      },
    })
    return wrapper
  }

  const arrive = async (answer) => {
    server.result.value = { chatGroupMessages: answer }
    await flushPromises()
  }

  const bubbles = () => wrapper.findAllComponents(ChatBubble)
  const bubbleTexts = () =>
    wrapper.findAll('[data-test="chat-bubble"] .chat-message-text').map((b) => b.text())
  const bar = () => wrapper.findComponent(ChatComposeBar)
  const status = () => wrapper.find('[data-test="chat-thread-sent"]')

  const write = async (text, { tick = false } = {}) => {
    await wrapper.find('[data-test="chat-compose-field"]').setValue(text)
    if (tick) await wrapper.find('[data-test="chat-compose-email"]').setValue(true)
    await wrapper.find('[data-test="chat-compose-send"]').trigger('click')
    await flushPromises()
  }

  /**
   * What is written in a group and not sent waits for the next opening of its window, as in the
   * thread with one person (utils/chatDraft): by the group's uuid.
   */
  describe('what was written and not sent', () => {
    const field = () => wrapper.find('[data-test="chat-compose-field"]')
    const closeWindow = () => {
      wrapper.unmount()
      wrapper = null
    }

    it('stands in the field again when the group’s window is opened again', async () => {
      mountThread()
      await arrive(page([message(1)]))
      await field().setValue('Bis Samstag im Café')
      closeWindow()

      mountThread()
      await arrive(page([message(1)]))

      expect(field().element.value).toBe('Bis Samstag im Café')
    })

    it('waits for that group only', async () => {
      mountThread()
      await arrive(page([message(1)]))
      await field().setValue('Bis Samstag im Café')
      closeWindow()

      mountThread({ groupUuid: 'garden-uuid' })
      await arrive(page([message(1)]))

      expect(field().element.value).toBe('')
    })

    it('is kept by the group’s uuid, apart from every person', async () => {
      mountThread({ groupUuid: 'CAFE-Uuid' })
      await arrive(page([message(1)]))
      await field().setValue('Bis Samstag im Café')

      expect(chatGroupDraftKey('CAFE-Uuid')).toBe('group/cafe-uuid')
      expect(chatDraftFor(() => 'me-id', 'group/cafe-uuid').read().text).toBe('Bis Samstag im Café')
    })
  })

  beforeEach(() => {
    serverSends.mockImplementation(async ({ body, announce }) => ({
      ...message(90, { writer: 'me', announcement: announce }),
      body,
    }))
  })

  afterEach(() => {
    wrapper?.unmount()
    markRead.mockClear()
    serverSends.mockReset()
    serverChanges.mockReset()
    asked.mockClear()
    facesAsked.mockClear()
    imageViews.mockClear()
    transfersAsked.mockClear()
    beat.pollNow.mockClear()
  })

  it("asks for the group's page by its uuid, past the cache", () => {
    mountThread()
    expect(server.document).toBe(chatGroupMessagesQuery)
    expect(server.variables).toEqual({ groupUuid: 'cafe-uuid', limit: 50 })
    expect(server.options).toEqual({ fetchPolicy: 'network-only' })
  })

  // E-053: the name over a message leads to its writer; the thread hands them to the window.
  it('hands the writer whose name was tapped on to the window', async () => {
    mountThread()
    await arrive(page([message(1, { writer: 'anna' })]))
    await bubbles()[0].vm.$emit('openMember', WRITERS.anna)
    expect(wrapper.emitted('openMember')).toEqual([[WRITERS.anna]])
  })

  // A transfer is between two (E-050 F6): no transfers stand in a group's thread. And the
  // member's own bookings are not asked on opening either: only a line after a call of their
  // own that is due asks them, once (E-043 B; see the suggestion to thank below).
  it('asks for no transfers on opening', async () => {
    mountThread()
    await arrive(page([message(1)]))
    expect(transfersAsked).toHaveBeenCalledWith(null, { enabled: false })
    expect(asked.mock.calls.some(([options]) => options.query === transactionsQuery)).toBe(false)
  })

  // E-066 is about a conversation between two. A group's box is the announcement, by mail to
  // everybody: no first message of anybody's ticks it.
  it("never begins with the announcement ticked, also for an owner's first message", async () => {
    mountThread({ role: 'OWNER' })
    await arrive(page([message(1, { writer: 'anna' }), message(3, { writer: 'carla' })]))

    expect(bar().props('firstOwn')).toBe(false)
    const box = wrapper.find('[data-test="chat-compose-email"]')
    expect(box.exists()).toBe(true)
    expect(box.element.checked).toBe(false)
  })

  // E-069 is about a conversation between two as well: no short answers over a group's field.
  it('never offers the three short answers', async () => {
    mountThread({ role: 'MEMBER' })
    await arrive(page([message(1, { writer: 'anna' }), message(3, { writer: 'carla' })]))

    expect(bar().props('helloBack')).toBe(false)
    expect(wrapper.find('[data-test="chat-compose-hello-back"]').exists()).toBe(false)
  })

  it('names the thread after the group, for the ear', async () => {
    mountThread()
    await arrive(page([message(1)]))
    expect(wrapper.find('[data-test="chat-thread-log"]').attributes('aria-label')).toBe(
      'chatGroup.label {"name":"Gradido-Café Berlin"}',
    )
  })

  it("moves the member's read pointer in the group to the newest message shown", async () => {
    mountThread()
    await arrive(page([message(1), message(3, { writer: 'carla' })]))
    expect(markRead).toHaveBeenCalledWith(
      markChatGroupRead,
      { groupUuid: 'cafe-uuid', upToMessageId: 3 },
      undefined,
    )
  })

  describe('who wrote what', () => {
    // A run of one writer shows face and name once; one's own message and a new day end it.
    it('stands the face and the name over the first message of each run', async () => {
      mountThread()
      await arrive(
        page([
          message(1),
          message(2),
          message(3, { writer: 'carla' }),
          message(4, { writer: 'me' }),
          message(5, { writer: 'carla' }),
          message(6, { writer: 'carla', day: '2026-09-30' }),
        ]),
      )
      expect(bubbles().map((bubble) => bubble.props('showWriter'))).toEqual([
        true,
        false,
        true,
        false,
        true,
        true,
      ])
      expect(bubbles().every((bubble) => bubble.props('inGroup'))).toBe(true)
      expect(
        wrapper.findAll('[data-test="chat-bubble-group-writer"]').map((name) => name.text()),
      ).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Carla-Sonne', 'Carla-Sonne'])
    })

    it("asks for the writers' faces, and never for one's own", async () => {
      mountThread()
      await arrive(
        page([message(1), message(2, { writer: 'me' }), message(3, { writer: 'carla' })]),
      )
      const users = facesAsked.mock.calls.at(-1)[1].map((user) => user.gradidoID)
      expect(users.sort()).toEqual(['anna-id', 'carla-id'])
    })

    it("says whose message arrived, by the writer's name", async () => {
      mountThread()
      await arrive(page([message(1)]))
      await beatBrings(message(7, { writer: 'carla' }))
      expect(status().text()).toBe('chatThread.arrived {"name":"Carla-Sonne"}')
    })

    // E-060: in a group it is the writer of the changed message, not the group, that is named.
    it("says who changed a message, by the writer's name", async () => {
      mountThread()
      await arrive(page([message(1), message(2, { writer: 'carla' }), message(3)]))

      await beatChanges({
        ...message(2, { writer: 'carla' }),
        body: 'Samstag ab 11 Uhr',
        editedAt: '2026-09-29T11:00:00.000Z',
      })

      expect(bubbleTexts()).toEqual(['message 1', 'Samstag ab 11 Uhr', 'message 3'])
      expect(status().text()).toBe('chatThread.editedBy {"name":"Carla-Sonne"}')
      // Into the group's own page.
      expect(server.result.value.chatGroupMessages.messages[1].editedAt).toBe(
        '2026-09-29T11:00:00.000Z',
      )
      expect(
        bubbles().map((bubble) => bubble.find('[data-test="chat-bubble-edited"]').exists()),
      ).toEqual([false, true, false])
    })

    it("opens a picture as the writer's, with their name", async () => {
      mountThread()
      const withPicture = {
        ...message(1, { writer: 'carla' }),
        images: [{ imageUuid: 'image-1', width: 800, height: 600 }],
      }
      await arrive(page([withPicture]))
      bubbles()[0].vm.$emit('openImage', {
        message: withPicture,
        image: withPicture.images[0],
        opener: null,
      })
      expect(imageViews).toHaveBeenCalledWith(
        expect.objectContaining({ who: 'Carla-Sonne', name: 'Carla-Sonne' }),
      )
    })
  })

  describe("the beat's messages", () => {
    // The group's conversation is known from the start: an empty thread takes its first
    // message, and nothing of another conversation.
    it("takes the group's messages, also into an empty thread, and nothing else", async () => {
      mountThread()
      await arrive(page([]))

      await beatBrings(
        { ...message(1), conversationId: 3, groupUuid: null },
        message(2, { writer: 'carla' }),
      )

      expect(bubbleTexts()).toEqual(['message 2'])
    })
  })

  describe('writing to the group', () => {
    it('sends to the group, and a message without the box is no announcement', async () => {
      mountThread({ role: 'OWNER' })
      await arrive(page([message(1)]))

      await write('Hallo zusammen')

      expect(serverSends).toHaveBeenCalledWith({
        groupUuid: 'cafe-uuid',
        announce: false,
        body: 'Hallo zusammen',
      })
      expect(bubbleTexts().at(-1)).toBe('Hallo zusammen')
    })

    // W3b (F E-046): only a message to one person answers a thank-you. The tile on the overview
    // hears nothing of a group's (useChatSent).
    it('says nothing to the overview of a message to the group', async () => {
      const heard = []
      const stop = onChatMessageSent((person) => heard.push(person))
      try {
        mountThread({ role: 'OWNER' })
        await arrive(page([message(1)]))

        await write('Hallo zusammen')

        expect(serverSends).toHaveBeenCalledTimes(1)
        expect(heard).toEqual([])
      } finally {
        stop()
      }
    })

    // E-050 F5: the box is the announcement, by mail to every member but the sender.
    it('sends an announcement where the box is ticked', async () => {
      mountThread({ role: 'MODERATOR' })
      await arrive(page([message(1)]))

      await write('Samstag um 14 Uhr', { tick: true })

      expect(serverSends).toHaveBeenCalledWith({
        groupUuid: 'cafe-uuid',
        announce: true,
        body: 'Samstag um 14 Uhr',
      })
    })

    // The note about a mute that held the mail back names one recipient: never in a group, even
    // where a copy should bring a mail state (coderabbit, #4013).
    it('says "sent" in a group, with no note about a mute', async () => {
      serverSends.mockImplementation(async ({ body }) => ({
        ...message(90, { writer: 'me' }),
        body,
        notify: 'EMAIL',
        mailState: 'MUTED',
      }))
      mountThread({ role: 'OWNER' })
      await arrive(page([message(1)]))

      await write('Samstag um 14 Uhr', { tick: true })

      expect(status().text()).toBe('chatThread.sent')
    })

    it("hands the bar the group's name, and no sentence about a first mail", async () => {
      mountThread()
      await arrive(page([]))
      expect(bar().props()).toMatchObject({
        name: 'Gradido-Café Berlin',
        first: false,
        group: true,
      })
    })

    it('offers the announcement to the owner and the moderators, and to nobody else', async () => {
      for (const [role, offered] of [
        ['OWNER', true],
        ['MODERATOR', true],
        ['MEMBER', false],
      ]) {
        mountThread({ role })
        await arrive(page([message(1)]))
        expect({ role, offered: bar().props('canAnnounce') }).toEqual({ role, offered })
        wrapper.unmount()
      }
      wrapper = null
    })

    it('says how many the announcement would reach -- everybody but the sender', async () => {
      mountThread({ role: 'OWNER', memberCount: 5 })
      await arrive(page([message(1)]))
      expect(bar().props('announceTo')).toBe(4)
    })

    // Nobody else in the group: nobody to announce to.
    it('offers no announcement where the member is alone in the group', async () => {
      mountThread({ role: 'OWNER', memberCount: 1 })
      await arrive(page([]))
      expect(bar().props('canAnnounce')).toBe(false)
    })
  })

  describe('the empty thread', () => {
    it('tells the one who opened the group that everybody had the mail', async () => {
      mountThread({ createdBy: { ...WRITERS.me, gradidoID: 'ME-ID' } })
      await arrive(page([]))
      expect(wrapper.find('[data-test="chat-thread-empty"]').text()).toBe('chatGroup.emptyOpened')
    })

    it('tells everybody else only that nothing is written yet', async () => {
      mountThread()
      await arrive(page([]))
      expect(wrapper.find('[data-test="chat-thread-empty"]').text()).toBe('chatGroup.empty')
    })

    // The opener's users row is gone: nobody to tell.
    it('tells nobody that they opened it where the opener is not known', async () => {
      mountThread({ createdBy: null })
      await arrive(page([]))
      expect(wrapper.find('[data-test="chat-thread-empty"]').text()).toBe('chatGroup.empty')
    })
  })

  /**
   * The way back after iOS started the wallet over (utils/chatReturn): a group's thread is noted
   * by the group's uuid, and a start that comes back to it hands its words to this field.
   */
  describe('the way back into the group', () => {
    const pageHidden = (value) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => value })
      document.dispatchEvent(new Event('visibilitychange'))
    }
    afterEach(() => {
      delete document.hidden
      window.localStorage.clear()
    })

    it('notes the group, with the words not sent yet, as the page goes out of sight', async () => {
      mountThread()
      await arrive(page([message(1)]))
      await wrapper.find('[data-test="chat-compose-field"]').setValue('Bis Samstag')
      pageHidden(true)
      expect(JSON.parse(window.localStorage.getItem('chat-return:me-id'))).toMatchObject({
        groupUuid: 'cafe-uuid',
        text: 'Bis Samstag',
      })
      pageHidden(false)
      expect(window.localStorage.getItem('chat-return:me-id')).toBeNull()
    })

    it('takes the words a start held for this group into its field', async () => {
      holdChatText({ groupUuid: 'cafe-uuid', text: 'Bis Samstag' })
      mountThread()
      await arrive(page([message(1)]))
      expect(wrapper.find('[data-test="chat-compose-field"]').element.value).toBe('Bis Samstag')
    })
  })

  it('puts an older page of the group in front of the one on screen', async () => {
    mountThread()
    await arrive(page([message(5), message(6)], { hasMore: true }))
    server.olderPages.push(page([message(3), message(4)]))

    await wrapper.find('[data-test="chat-thread-older"]').trigger('click')
    await flushPromises()

    expect(server.fetchMore).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { before: 5 } }),
    )
    expect(bubbleTexts()).toEqual(['message 3', 'message 4', 'message 5', 'message 6'])
  })

  /**
   * E-060: one's own message in a group is changed as in a thread of two -- the same mutation, by
   * the message's uuid, and the answer in the old one's place in the GROUP's page.
   */
  describe('a message of one’s own, changed (E-060)', () => {
    const pressEdit = async (index) => {
      const row = wrapper.findAll('[data-test="chat-bubble"]')[index]
      await row.find('[data-test="chat-bubble-more"]').trigger('click')
      await flushPromises()
      await row.find('[data-test="chat-message-edit"]').trigger('click')
      await flushPromises()
    }

    it('offers "Bearbeiten" at one’s own message only, also to an ordinary member', async () => {
      mountThread({ role: 'MEMBER' })
      await arrive(page([message(1), message(2, { writer: 'me' })]))
      const rows = wrapper.findAll('[data-test="chat-bubble"]')

      await rows[0].find('[data-test="chat-bubble-more"]').trigger('click')
      await flushPromises()
      expect(rows[0].find('[data-test="chat-message-edit"]').exists()).toBe(false)

      await rows[1].find('[data-test="chat-bubble-more"]').trigger('click')
      await flushPromises()
      expect(rows[1].find('[data-test="chat-message-edit"]').exists()).toBe(true)
    })

    it('changes it by its uuid, and puts the answer into the group’s page', async () => {
      serverChanges.mockResolvedValue({
        ...message(2, { writer: 'me' }),
        body: 'Samstag ab 11 Uhr',
        editedAt: '2026-09-29T11:00:00.000Z',
      })
      mountThread()
      await arrive(page([message(1), message(2, { writer: 'me' }), message(3)]))
      await pressEdit(1)
      expect(wrapper.find('[data-test="chat-compose-field"]').element.value).toBe('message 2')

      await wrapper.find('[data-test="chat-compose-field"]').setValue('Samstag ab 11 Uhr')
      await wrapper.find('[data-test="chat-compose-send"]').trigger('click')
      await flushPromises()

      expect(serverChanges).toHaveBeenCalledWith(
        { messageUuid: 'uuid-2', body: 'Samstag ab 11 Uhr' },
        { fetchPolicy: 'no-cache' },
      )
      expect(serverSends).not.toHaveBeenCalled()
      expect(bubbleTexts()).toEqual(['message 1', 'Samstag ab 11 Uhr', 'message 3'])
      expect(server.result.value.chatGroupMessages.messages.map((m) => m.id)).toEqual([1, 2, 3])
      expect(status().text()).toBe('chatThread.editSaved')
      expect(bar().props('editing')).toBeNull()
    })

    // While a message is changed there is nothing to announce: the box waits with the rest.
    it('offers no announcement while a message is being changed', async () => {
      mountThread({ role: 'OWNER' })
      await arrive(page([message(1), message(2, { writer: 'me' })]))
      expect(wrapper.find('[data-test="chat-compose-email"]').exists()).toBe(true)

      await pressEdit(1)

      expect(wrapper.find('[data-test="chat-compose-email"]').exists()).toBe(false)
    })
  })

  /**
   * W2 of the waves of gratitude in a group (Bernd, 28.10.2026): under the member's own video
   * invitation, half an hour after the call began, "Möchtest Du Dich für das Gespräch bedanken?"
   * -- "Jemandem danken" shows the other members, and one tap on one takes the member to the send
   * form with them. Whom the member thanked since the call began is read off their own bookings
   * (E-043 B, Bernd 05.11.2026): what was thanked is what was booked. The tap remembers nothing;
   * "Nicht jetzt" ends the line.
   */
  describe('the suggestion to thank after a video call of one’s own', () => {
    const BEGAN = new Date('2026-10-26T15:00:00.000Z').getTime()
    const MINUTE = 60 * 1000
    const CALL = { room: 'https://meet.example/abc', topic: 'Videoanruf', when: null }
    const MEMBERS = ['me', 'anna', 'carla'].map((writer) => ({
      user: { ...WRITERS[writer], communityName: 'Home', avatarUpdatedAt: null },
      role: writer === 'anna' ? 'OWNER' : 'MEMBER',
      joinedAt: '2026-09-27T10:00:00.000Z',
    }))
    const invitation = (writer = 'me', body = 'the invitation') => ({
      ...message(2, { writer }),
      body,
      createdAt: new Date(BEGAN).toISOString(),
    })
    /**
     * Anna's invitation as her wallet wrote it, read by its link (E-043 C, Bernd 06.11.2026): the
     * room's address in Gradido's own form at its end.
     */
    const ANNAS = `📹 Videoanruf: Videoanruf\nDer Raum liegt auf einem Jitsi-Server von Freifunk — ein Vorschlag, kein Dienst von Gradido: ${CALL.room}#config.subject=%22Videoanruf%22`
    /** The member clicked the link of the invitation (`uuid-2`) here, `minutes` after it began. */
    const clickedAt = (minutes) => noteChatVideoJoined('me-id', 'uuid-2', BEGAN + minutes * MINUTE)

    /**
     * The member's own booking list (useOwnTransfers), as the server answers it unnarrowed: the
     * rows newest first, `count` the bookings of the whole list. Without a test's own: none.
     */
    const bookingsPage = (rows, count = rows.length) => ({
      data: { transactionList: { balance: { count }, transactions: rows } },
    })
    const ownBookings = vi.fn()

    /** A booking of the member's own with a member, `minutes` after the call began: `n` its id. */
    const booking = (n, { minutes = 10, writer = 'carla', sent = true } = {}) => ({
      id: n,
      typeId: sent ? 'SEND' : 'RECEIVE',
      amount: sent ? '-10' : '10',
      balance: '100',
      previousBalance: '90',
      balanceDate: new Date(BEGAN + minutes * MINUTE).toISOString(),
      memo: `memo ${n}`,
      linkedUser: { ...WRITERS[writer], communityName: 'Home', avatarUpdatedAt: null },
      decay: null,
      linkId: null,
    })

    /** What the thread asked of the member's own booking list. */
    const bookingsAsked = () =>
      asked.mock.calls.filter(([options]) => options.query === transactionsQuery)

    const line = () => wrapper.find('[data-test="thanks-nudge"]')
    const question = () => wrapper.find('[data-test="thanks-nudge-question"]').text()
    const names = () =>
      wrapper.findAll('[data-test="thanks-nudge-choice-name"]').map((name) => name.text())
    const press = async (selector) => {
      await wrapper.find(selector).trigger('click')
      await flushPromises()
    }
    const choose = async () => press('[data-test="thanks-nudge-yes"]')
    const mountAt = async (minutes, { members = MEMBERS, writer = 'me', body } = {}) => {
      vi.setSystemTime(BEGAN + minutes * MINUTE)
      mountThread({}, { groupMembers: members })
      await arrive(page([message(1), invitation(writer, body)]))
      await flushPromises()
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
      videoInviteRead.mockImplementation((i18n, text) => (text === 'the invitation' ? CALL : null))
      ownBookings.mockImplementation(async () => bookingsPage([]))
      asked.mockImplementation(async (options) => {
        if (options.query === transactionsQuery) return ownBookings(options.variables)
        throw new Error('no server for this question')
      })
    })

    afterEach(() => {
      wrapper?.unmount()
      wrapper = null
      vi.useRealTimers()
      videoInviteRead.mockReset()
      videoInviteRead.mockImplementation(() => null)
      ownBookings.mockReset()
      asked.mockImplementation(async () => {
        throw new Error('no server for this question')
      })
      delete storeState.transfersInChat
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('thanks-nudge:') || key.startsWith('chat-video-joined:')) {
          window.localStorage.removeItem(key)
        }
      }
    })

    it('stands half an hour after the call began, asking without a name, with "Jemandem danken"', async () => {
      await mountAt(29)
      expect(line().exists()).toBe(false)

      vi.advanceTimersByTime(MINUTE)
      await flushPromises()

      expect(bubbles()[1].find('[data-test="thanks-nudge"]').exists()).toBe(true)
      expect(question()).toBe('thanksNudge.afterGroupCall')
      expect(wrapper.find('[data-test="thanks-nudge-yes"]').text()).toBe('thanksNudge.someone')
    })

    it('shows the other members by name on "Jemandem danken", the member not among them', async () => {
      await mountAt(45)

      await choose()

      expect(question()).toBe('thanksNudge.whom')
      expect(names()).toEqual(['Anna-Sonne', 'Carla-Sonne'])
      // Nothing is answered by opening the choice: a window closed now finds the line again.
      expect(window.localStorage.getItem('thanks-nudge:me-id:call:uuid-2')).toBeNull()
    })

    // W7: a thank-you begun and not sent leaves the member standing -- "Zurück" from the send form
    // finds the line as it was. Only what is booked ends it for that member.
    it('takes a member chosen to the window, and remembers nothing: the line and the member stay', async () => {
      await mountAt(45)
      await choose()

      await wrapper.findAll('[data-test="thanks-nudge-choice"]')[1].trigger('click')
      await flushPromises()

      expect(wrapper.emitted('thank')).toEqual([[MEMBERS[2].user]])
      expect(window.localStorage.getItem('thanks-nudge:me-id:call:uuid-2')).toBeNull()
      expect(line().exists()).toBe(true)
      expect(names()).toEqual(['Anna-Sonne', 'Carla-Sonne'])
    })

    it('"Nicht jetzt": the line goes, and the window is told nothing', async () => {
      await mountAt(45)

      await press('[data-test="thanks-nudge-no"]')

      expect(line().exists()).toBe(false)
      expect(wrapper.emitted('thank')).toBeUndefined()
      expect(window.localStorage.getItem('thanks-nudge:me-id:call:uuid-2')).toBe('1')
    })

    // W7: not on opening for nothing, not on the beat -- once, when the first line is due. And
    // quietly: the clock turned the line due, not the member -- the idle logout stays where it was.
    describe('the member’s own bookings', () => {
      it('are not asked before a line is due, and once when it is, leaving the session clock alone', async () => {
        await mountAt(29)
        expect(bookingsAsked()).toHaveLength(0)

        vi.advanceTimersByTime(MINUTE)
        await flushPromises()

        expect(bookingsAsked()).toHaveLength(1)
        expect(bookingsAsked()[0][0]).toEqual({
          query: transactionsQuery,
          variables: { currentPage: 1, pageSize: 25, order: 'DESC', counterparty: null },
          fetchPolicy: 'no-cache',
          context: { renewSession: false },
        })
      })

      // The chat's beat and the minute clock ask nothing more.
      it('are asked once for the opening, however long the thread stays open', async () => {
        await mountAt(45)
        expect(bookingsAsked()).toHaveLength(1)

        vi.advanceTimersByTime(10 * MINUTE)
        await flushPromises()
        await beatBrings(message(3, { writer: 'carla' }))

        expect(bookingsAsked()).toHaveLength(1)
        expect(line().exists()).toBe(true)
      })

      // Falle 12: "Zurück" from the send form builds the group's window anew, and it asks anew.
      it('are asked anew with the next opening of the window', async () => {
        await mountAt(45)
        wrapper.unmount()
        ownBookings.mockImplementation(async () => bookingsPage([booking(7)]))

        await mountAt(46)
        await choose()

        expect(bookingsAsked()).toHaveLength(2)
        expect(names()).toEqual(['Anna-Sonne'])
      })

      // E-043 C: under Anna's invitation only once the member went into her room from here (see
      // below) -- without the click, nothing is asked.
      it('are not asked under somebody else’s invitation the member did not go into, nor where there is nobody to choose', async () => {
        await mountAt(45, { writer: 'anna', body: ANNAS })
        wrapper.unmount()
        await mountAt(45, { members: [MEMBERS[0]] })

        expect(bookingsAsked()).toHaveLength(0)
      })

      // E-043 B, Festlegung 2: the switch says whether transfers are SHOWN in a conversation;
      // here nothing is shown, a name is only left out.
      it('are asked also where the member switched the transfers in the chat off', async () => {
        storeState.transfersInChat = false
        ownBookings.mockImplementation(async () => bookingsPage([booking(7)]))
        await mountAt(45)

        await choose()

        expect(bookingsAsked()).toHaveLength(1)
        expect(names()).toEqual(['Anna-Sonne'])
      })
    })

    /**
     * E-043 C (Bernd, 05.11.2026): Anna invited the group, the member clicked her link in this
     * wallet -- half an hour after that click "Jemandem danken" offers the others, Anna among them,
     * and a member thanked since the CLICK is no longer among them.
     */
    describe('under somebody else’s invitation the member went into', () => {
      const annas = { writer: 'anna', body: ANNAS }

      it('stands half an hour after the click, offering the others with the one who invited', async () => {
        clickedAt(15)
        await mountAt(45, annas)

        expect(bubbles()[1].find('[data-test="thanks-nudge"]').exists()).toBe(true)
        expect(question()).toBe('thanksNudge.afterGroupCall')
        await choose()
        expect(names()).toEqual(['Anna-Sonne', 'Carla-Sonne'])
        expect(bookingsAsked()).toHaveLength(1)
        expect(vi.getTimerCount()).toBe(1)
      })

      it('not before half an hour after the click, however old the invitation', async () => {
        clickedAt(25)
        await mountAt(45, annas)
        expect(line().exists()).toBe(false)
        expect(bookingsAsked()).toHaveLength(0)

        vi.advanceTimersByTime(10 * MINUTE)
        await flushPromises()

        expect(line().exists()).toBe(true)
        expect(bookingsAsked()).toHaveLength(1)
      })

      it('leaves out who was thanked since the click, not who was thanked before it', async () => {
        clickedAt(15)
        ownBookings.mockImplementation(async () =>
          bookingsPage([booking(7, { writer: 'anna', minutes: 20 })]),
        )
        await mountAt(45, annas)
        await choose()
        expect(names()).toEqual(['Carla-Sonne'])

        wrapper.unmount()
        ownBookings.mockImplementation(async () =>
          bookingsPage([booking(7, { writer: 'anna', minutes: 10 })]),
        )
        await mountAt(45, annas)
        await choose()
        expect(names()).toEqual(['Anna-Sonne', 'Carla-Sonne'])
      })

      // The bookings are asked back to the click: a full page whose oldest booking lies between
      // the invitation and the click is the last one asked.
      it('asks the member’s own bookings back to the click', async () => {
        clickedAt(15)
        const rows = Array.from({ length: 25 }, (_, i) =>
          booking(100 + i, { minutes: 34 - i, sent: false }),
        )
        ownBookings.mockImplementation(async () => bookingsPage(rows, 50))

        await mountAt(45, annas)

        expect(rows.at(-1).balanceDate).toBe(new Date(BEGAN + 10 * MINUTE).toISOString())
        expect(bookingsAsked()).toHaveLength(1)
      })

      it('not under a copy forwarded from another conversation', async () => {
        clickedAt(15)
        vi.setSystemTime(BEGAN + 45 * MINUTE)
        mountThread({}, { groupMembers: MEMBERS })
        await arrive(page([message(1), { ...invitation('anna', ANNAS), forwarded: true }]))
        await flushPromises()

        expect(line().exists()).toBe(false)
        expect(bookingsAsked()).toHaveLength(0)
      })
    })

    // As with one person: before they are known, a thank-you on its way would stand under a line.
    it('not while the member’s own bookings are out, and as they are once they are in', async () => {
      let answer
      ownBookings.mockImplementation(
        () =>
          new Promise((resolve) => {
            answer = () => resolve(bookingsPage([booking(7)]))
          }),
      )
      await mountAt(45)
      expect(line().exists()).toBe(false)

      answer()
      await flushPromises()
      await choose()

      expect(names()).toEqual(['Anna-Sonne'])
    })

    // Where they could not be asked, nothing is known -- and nothing is said about it.
    it('not where the member’s own bookings could not be asked', async () => {
      ownBookings.mockImplementation(async () => {
        throw new Error('Failed to fetch')
      })
      await mountAt(45)

      expect(line().exists()).toBe(false)
      expect(wrapper.text()).not.toContain('Failed to fetch')
    })

    describe('a thank-you booked', () => {
      const offeredAfter = async (rows) => {
        ownBookings.mockImplementation(async () => bookingsPage(rows))
        await mountAt(45)
        if (!line().exists()) return null
        await choose()
        return names()
      }

      it('since the call began leaves that member out, the others stay', async () => {
        expect(await offeredAfter([booking(7, { writer: 'carla', minutes: 10 })])).toEqual([
          'Anna-Sonne',
        ])
      })

      it('before the call began is no thank-you for it', async () => {
        expect(await offeredAfter([booking(7, { writer: 'carla', minutes: -1 })])).toEqual([
          'Anna-Sonne',
          'Carla-Sonne',
        ])
      })

      // What came in is the other one's thank-you.
      it('by a member to the member is none of the member’s', async () => {
        expect(await offeredAfter([booking(7, { writer: 'carla', sent: false })])).toEqual([
          'Anna-Sonne',
          'Carla-Sonne',
        ])
      })

      it('to everybody ends the line', async () => {
        expect(
          await offeredAfter([booking(8, { writer: 'anna' }), booking(7, { writer: 'carla' })]),
        ).toBeNull()
      })

      // KF-004: a booking with a member of this community may name no community.
      it('that names no community is one of this community', async () => {
        const plain = {
          ...booking(7),
          linkedUser: { ...booking(7).linkedUser, communityUuid: null },
        }
        expect(await offeredAfter([plain])).toEqual(['Anna-Sonne'])
      })
    })

    // Back to the call's beginning: the next page only while the oldest of the last one is not
    // older than it.
    describe('pages', () => {
      const pageOf = (from, minutes) =>
        Array.from({ length: 25 }, (_, i) =>
          booking(from - i, { writer: 'anna', minutes, sent: false }),
        )

      it('asks the next page while the oldest booking is younger than the beginning', async () => {
        ownBookings.mockImplementation(async ({ currentPage }) =>
          currentPage === 1
            ? bookingsPage(pageOf(100, 20), 30)
            : bookingsPage([booking(7, { writer: 'carla', minutes: 5 })], 30),
        )
        await mountAt(45)
        await choose()

        expect(bookingsAsked().map(([options]) => options.variables.currentPage)).toEqual([1, 2])
        expect(names()).toEqual(['Anna-Sonne'])
      })

      it('not where the oldest booking is older than the beginning', async () => {
        const rows = [...pageOf(100, 20).slice(0, 24), booking(76, { writer: 'anna', minutes: -2 })]
        ownBookings.mockImplementation(async ({ currentPage }) =>
          currentPage === 1
            ? bookingsPage(rows, 30)
            : bookingsPage([booking(7, { writer: 'carla', minutes: 5 })], 30),
        )
        await mountAt(45)
        await choose()

        expect(bookingsAsked()).toHaveLength(1)
        expect(names()).toEqual(['Anna-Sonne', 'Carla-Sonne'])
      })

      // Two calls of the member's own, both due: the bookings are asked back to the EARLIER one,
      // and each line counts from its own beginning. Carla was thanked between the two calls --
      // for the first one, not for the second.
      it('back to the earliest call whose line is due, each line counting from its own beginning', async () => {
        const second = {
          ...message(3, { writer: 'me' }),
          body: 'the second invitation',
          createdAt: new Date(BEGAN + 20 * MINUTE).toISOString(),
        }
        videoInviteRead.mockImplementation((i18n, text) =>
          text === 'the invitation' || text === 'the second invitation' ? CALL : null,
        )
        ownBookings.mockImplementation(async ({ currentPage }) =>
          currentPage === 1
            ? bookingsPage(pageOf(100, 15), 30)
            : bookingsPage([booking(7, { writer: 'carla', minutes: 10 })], 30),
        )
        vi.setSystemTime(BEGAN + 60 * MINUTE)
        mountThread({}, { groupMembers: MEMBERS })
        await arrive(page([message(1), invitation(), second]))
        await flushPromises()

        const offeredUnder = async (index) => {
          const under = bubbles()[index]
          await under.find('[data-test="thanks-nudge-yes"]').trigger('click')
          await flushPromises()
          return under.findAll('[data-test="thanks-nudge-choice-name"]').map((name) => name.text())
        }
        expect(bookingsAsked().map(([options]) => options.variables.currentPage)).toEqual([1, 2])
        expect(await offeredUnder(1)).toEqual(['Anna-Sonne'])
        expect(await offeredUnder(2)).toEqual(['Anna-Sonne', 'Carla-Sonne'])
      })
    })

    // Nobody to choose: before the window has the members, or where the member is alone in it.
    it('not before the window has the members, nor where the member is alone in the group', async () => {
      await mountAt(45, { members: [] })
      expect(line().exists()).toBe(false)
      wrapper.unmount()

      await mountAt(45, { members: [MEMBERS[0]] })
      expect(line().exists()).toBe(false)
    })

    // Who cannot be named in the send form is not offered: a member without their community.
    it('offers only members the send form can name', async () => {
      const lost = { ...MEMBERS[1], user: { ...MEMBERS[1].user, communityUuid: null } }
      await mountAt(45, { members: [MEMBERS[0], lost, MEMBERS[2]] })

      await choose()

      expect(names()).toEqual(['Carla-Sonne'])
    })

    // The one invited is not pressed to thank.
    it('not under somebody else’s invitation in the group', async () => {
      await mountAt(45, { writer: 'anna' })

      expect(line().exists()).toBe(false)
    })

    // The line comes while the member sits in the group's conversation -- and asking the member's
    // own bookings adds no clock of its own.
    it('keeps its quiet clock while the group’s thread is open, and stops it when it closes', async () => {
      await mountAt(45)
      expect(bookingsAsked()).toHaveLength(1)
      expect(vi.getTimerCount()).toBe(1)

      wrapper.unmount()
      wrapper = null

      expect(vi.getTimerCount()).toBe(0)
    })
  })
})
