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

  // A transfer is between two (E-050 F6): no booking list is asked in a group.
  // E-053: the name over a message leads to its writer; the thread hands them to the window.
  it('hands the writer whose name was tapped on to the window', async () => {
    mountThread()
    await arrive(page([message(1, { writer: 'anna' })]))
    await bubbles()[0].vm.$emit('openMember', WRITERS.anna)
    expect(wrapper.emitted('openMember')).toEqual([[WRITERS.anna]])
  })

  it('asks for no transfers', async () => {
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
   * form with them. Nothing of a transfer stands in a group (E-050 F6): only the answer ends it.
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
    const invitation = (writer = 'me') => ({
      ...message(2, { writer }),
      body: 'the invitation',
      createdAt: new Date(BEGAN).toISOString(),
    })

    const line = () => wrapper.find('[data-test="thanks-nudge"]')
    const question = () => wrapper.find('[data-test="thanks-nudge-question"]').text()
    const names = () =>
      wrapper.findAll('[data-test="thanks-nudge-choice-name"]').map((name) => name.text())
    const press = async (selector) => {
      await wrapper.find(selector).trigger('click')
      await flushPromises()
    }
    const mountAt = async (minutes, { members = MEMBERS, writer = 'me' } = {}) => {
      vi.setSystemTime(BEGAN + minutes * MINUTE)
      mountThread({}, { groupMembers: members })
      await arrive(page([message(1), invitation(writer)]))
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
      videoInviteRead.mockImplementation((i18n, text) => (text === 'the invitation' ? CALL : null))
    })

    afterEach(() => {
      wrapper?.unmount()
      wrapper = null
      vi.useRealTimers()
      videoInviteRead.mockReset()
      videoInviteRead.mockImplementation(() => null)
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('thanks-nudge:')) window.localStorage.removeItem(key)
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

      await press('[data-test="thanks-nudge-yes"]')

      expect(question()).toBe('thanksNudge.whom')
      expect(names()).toEqual(['Anna-Sonne', 'Carla-Sonne'])
      // Nothing is answered by opening the choice: a window closed now finds the line again.
      expect(window.localStorage.getItem('thanks-nudge:me-id:call:uuid-2')).toBeNull()
    })

    it('takes a member chosen to the window, and answers the line on this device', async () => {
      await mountAt(45)
      await press('[data-test="thanks-nudge-yes"]')

      await wrapper.findAll('[data-test="thanks-nudge-choice"]')[1].trigger('click')
      await flushPromises()

      expect(wrapper.emitted('thank')).toEqual([[MEMBERS[2].user]])
      expect(window.localStorage.getItem('thanks-nudge:me-id:call:uuid-2')).toBe('1')
      expect(line().exists()).toBe(false)
    })

    it('"Nicht jetzt": the line goes, and the window is told nothing', async () => {
      await mountAt(45)

      await press('[data-test="thanks-nudge-no"]')

      expect(line().exists()).toBe(false)
      expect(wrapper.emitted('thank')).toBeUndefined()
      expect(window.localStorage.getItem('thanks-nudge:me-id:call:uuid-2')).toBe('1')
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

      await press('[data-test="thanks-nudge-yes"]')

      expect(names()).toEqual(['Carla-Sonne'])
    })

    // The one invited is not pressed to thank.
    it('not under somebody else’s invitation in the group', async () => {
      await mountAt(45, { writer: 'anna' })

      expect(line().exists()).toBe(false)
    })

    // The line comes while the member sits in the group's conversation.
    it('keeps its quiet clock while the group’s thread is open, and stops it when it closes', async () => {
      await mountAt(45)
      expect(vi.getTimerCount()).toBe(1)

      wrapper.unmount()
      wrapper = null

      expect(vi.getTimerCount()).toBe(0)
    })
  })
})
