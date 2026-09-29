// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import ChatThread from './ChatThread.vue'
import ChatBubble from './ChatBubble.vue'
import ChatComposeBar from './ChatComposeBar.vue'
import {
  chatGroupMessagesQuery,
  markChatGroupRead,
  sendChatGroupMessage,
} from '@/graphql/chatGroups.graphql'
import { transactionsQuery } from '@/graphql/transactions.graphql'

/**
 * A group's thread (P5): ChatThread in its group's kind. What it shares with the thread of two --
 * scrolling, older pages, the bar's text -- is ChatThread.spec's; this file holds what differs:
 * what it is asked by, where it sends, who wrote what, and what the box means.
 */

const beat = vi.hoisted(() => ({ listeners: new Set(), pollNow: vi.fn(async () => {}) }))
vi.mock('@/composables/useChatUpdates', () => ({
  onChatMessages: (listener) => {
    beat.listeners.add(listener)
    return () => beat.listeners.delete(listener)
  },
  pollChatNow: (...args) => beat.pollNow(...args),
}))
const beatBrings = async (...chatMessages) => {
  for (const listener of [...beat.listeners]) listener(chatMessages)
  await flushPromises()
}

const storeState = vi.hoisted(() => ({
  gradidoID: 'me-id',
  username: 'Bernd',
  communityUuid: 'home-uuid',
}))
vi.mock('vuex', () => ({ useStore: () => ({ state: storeState }) }))

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

let server
const markRead = vi.fn(async () => ({ data: { markChatGroupRead: true } }))
const serverSends = vi.fn()
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

describe('ChatThread in a group', () => {
  let wrapper

  const mountThread = (group = {}) => {
    wrapper = mount(ChatThread, {
      props: { group: { ...GROUP, ...group } },
      global: {
        stubs: {
          IMdiChatOutline: true,
          IMdiEmailOutline: true,
          IMdiSend: true,
          IMdiPaperclip: true,
          IMdiCellphone: true,
          IMdiOpenInNew: true,
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
  it('asks for no transfers', async () => {
    mountThread()
    await arrive(page([message(1)]))
    expect(transfersAsked).toHaveBeenCalledWith(null, { enabled: false })
    expect(asked.mock.calls.some(([options]) => options.query === transactionsQuery)).toBe(false)
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
})
