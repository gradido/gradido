// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import ContactWindow from './ContactWindow.vue'
import { chatVideoRoom, chatVideoServerChoices } from '@/graphql/chat.graphql'
import { withChatVideoTopic } from '@/utils/chatVideoTopic'
import { CHAT_VIDEO_JOIN } from '@/utils/chatVideoApp'

const pushSpy = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushSpy }),
}))
/**
 * The one word the window fills in by itself, the video call's default topic (V4a), as a word:
 * it goes into the room's address, and a test reads it there. A test may change it for a
 * language of its own. Every other text shows its key and its values.
 */
const words = vi.hoisted(() => ({ 'chatThread.videoTopicDefault': 'Videoanruf' }))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      typeof values === 'number'
        ? `${key}:${values}`
        : values
          ? `${key} ${JSON.stringify(values)}`
          : (words[key] ?? key),
    d: (date, format) => `${format}(${date.toISOString()})`,
    // The language the day and the time zone of a planned call are written in (V5b).
    locale: { value: 'de' },
  }),
}))
vi.mock('@/i18n', () => ({
  default: { global: { t: (key) => key } },
}))
vi.mock('@/composables/useMemberAvatars', () => ({
  memberAvatarProps: (user) => ({ initials: (user?.alias ?? '').slice(0, 2).toUpperCase() }),
}))
vi.mock('@/config', () => ({
  default: { COMMUNITY_URL: 'https://gradido.test' },
}))
// The signed-in member's community, which a member without one is read as (LOG-036). In
// capitals, as a server may write it: the thread's key is in lower case either way.
// And the member signed in on this device, whose tick the box "Start in the Jitsi app" keeps (V4b).
vi.mock('vuex', () => ({
  useStore: () => ({ state: { communityUuid: 'HOME-UUID', gradidoID: 'me-id' } }),
}))

/** What the server answers to `setChatConversationMuted`; a test decides, or makes it throw. */
const serverMutes = vi.fn()
/**
 * What the server answers to the video room query (`client.query`): a test decides, or makes it
 * throw. Called with the whole options, so a test can say how it was asked.
 */
const serverRooms = vi.fn()
/**
 * What the server answers to the question which servers there are to choose from (V5,
 * `client.query` as well): a test decides; unanswered, the choice is "at random" only.
 */
const serverChoices = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: (variables) => serverMutes(variables) }),
  useApolloClient: () => ({
    client: {
      query: (options) =>
        options.query === chatVideoServerChoices ? serverChoices(options) : serverRooms(options),
    },
  }),
}))

/**
 * What the thread's `deliver` answers for the video invitation (ChatThread, exposed): true where
 * it reached the person. Its own spec is about how; here a test decides.
 */
const threadDelivers = vi.fn()

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess, toastError }),
}))

const CONTACT = {
  user: {
    communityUuid: 'home-uuid',
    communityName: 'Gradido-Akademie',
    gradidoID: 'carla-id',
    alias: 'Carla-Sonne',
    avatarColorIndex: 2,
  },
  firstAt: '2026-07-04T10:00:00.000Z',
  lastAt: '2026-09-01T18:42:00.000Z',
  bookings: 12,
  favorite: true,
  homeCommunity: true,
}

const STRANGER = {
  ...CONTACT,
  user: {
    ...CONTACT.user,
    communityUuid: 'provence-uuid',
    communityName: 'Gradido Provence',
    gradidoID: 'sarah-id',
    alias: 'Sarah',
  },
  homeCommunity: false,
}

/**
 * Every thread the window made, in order -- one entry per MOUNT, so a test can tell a thread
 * that was kept from one that was made anew.
 */
let threadsMade = []

/** The thread's steps between hits, as the window's arrows ask for them (E-057). */
let searchSteps = []

describe('ContactWindow', () => {
  let wrapper

  const mountWindow = (contact = CONTACT, extra = {}) => {
    wrapper = mount(ContactWindow, {
      props: { modelValue: true, contact, ...extra },
      global: {
        mocks: {
          $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
        },
        stubs: {
          // Shows what it holds while it is open, the footer under it -- the window itself is
          // always open here; the question before a video call opens and closes.
          BModal: {
            name: 'BModal',
            props: { modelValue: Boolean },
            emits: ['update:modelValue', 'shown'],
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
          // Renders its slot, says where it leads, and does what the real link's own click
          // handler does: it claims the event (preventDefault) exactly when the click would
          // navigate in this tab -- a plain click, not one with a modifier key. The window's
          // close-on-the-way rule reads that claim, so the stub has to make it.
          RouterLink: {
            props: ['to'],
            template:
              '<a :data-to="JSON.stringify(to)" @click="$event.metaKey || $event.preventDefault()"><slot /></a>',
          },
          IMdiBellOutline: true,
          IMdiBellOffOutline: true,
          IMdiVideoOutline: true,
          IMdiCogOutline: true,
          IMdiLinkVariant: true,
          IMdiCheck: true,
          IMdiServerOutline: true,
          IMdiCalendarPlusOutline: true,
          IMdiMagnify: true,
          IMdiChevronUp: true,
          IMdiChevronDown: true,
          // The thread reads the server; its own spec is about that. Here it only has to say
          // whom it was made for, count how often it was made, and take a video invitation
          // (`deliver`, which the real one exposes) for whom it was made. And it takes the
          // question before joining a call that the window provides, as the text of a message
          // does (ChatMessageText), so that a test can click an invitation's link through it.
          ChatThread: {
            name: 'ChatThread',
            props: {
              member: Object,
              alias: String,
              memberKey: String,
              greeting: String,
              textOnly: Boolean,
              search: String,
            },
            emits: ['chatConversation', 'search'],
            inject: { join: { from: CHAT_VIDEO_JOIN, default: null } },
            mounted() {
              threadsMade.push(this.member.gradidoID)
            },
            methods: {
              deliver(message) {
                return threadDelivers(message, this.member.gradidoID)
              },
              searchStep(direction) {
                searchSteps.push(direction)
              },
            },
            template:
              '<div data-test="chat-thread" :data-who="member.gradidoID" :data-community="String(member.communityUuid)" :data-alias="alias" :data-key="memberKey" :data-greeting="greeting" :data-text-only="String(textOnly)" :data-search="search" />',
          },
          AppAvatar: {
            props: ['initials'],
            template: '<i data-test="avatar" :data-initials="initials" />',
          },
          FavoriteHeart: {
            props: { member: Object },
            template: '<i data-test="heart" :data-id="member.gradidoID" />',
          },
        },
      },
    })
    return wrapper
  }

  afterEach(() => {
    wrapper?.unmount()
    pushSpy.mockClear()
    serverMutes.mockReset()
    serverRooms.mockReset()
    serverChoices.mockReset()
    threadDelivers.mockReset()
    toastSuccess.mockClear()
    toastError.mockClear()
    threadsMade = []
    searchSteps = []
    vi.restoreAllMocks()
  })

  /** What the thread tells the window once its first page is in (ChatThread, `chatConversation`). */
  const threadSays = async (conversation) => {
    wrapper.findComponent({ name: 'ChatThread' }).vm.$emit('chatConversation', conversation)
    await flushPromises()
  }
  const bell = () => wrapper.find('[data-test="contact-window-bell"]')
  const sendButton = () => wrapper.find('[data-test="contact-window-send"]')

  /**
   * E-057 (Bernd, 30.09.2026): the magnifier by the cross opens the search bar; what is typed goes
   * to the thread, what it found comes back into the bar, and ↑ and ↓ step in it. Esc closes the
   * search and leaves the window open; the next person begins unsearched.
   */
  describe('the search', () => {
    const magnifier = () => wrapper.find('[data-test="contact-window-search"]')
    const field = () => wrapper.find('[data-test="chat-search-field"]')
    const thread = () => wrapper.find('[data-test="chat-thread"]')

    it('opens with the magnifier by the cross, and hands what is typed to the thread', async () => {
      mountWindow()
      const top = wrapper.find('.contact-window-top')
      expect(top.find('[data-test="contact-window-search"]').exists()).toBe(true)
      expect(magnifier().attributes('aria-label')).toBe('chatSearch.open')
      expect(magnifier().attributes('aria-pressed')).toBe('false')

      await magnifier().trigger('click')
      expect(magnifier().attributes('aria-pressed')).toBe('true')
      await field().setValue('Bank')
      expect(thread().attributes('data-search')).toBe('Bank')
    })

    it('shows what the thread found, and steps through it', async () => {
      mountWindow()
      await magnifier().trigger('click')
      await field().setValue('Bank')
      await wrapper
        .findComponent({ name: 'ChatThread' })
        .vm.$emit('search', { searching: true, count: 3, current: 3, busy: false, capped: false })
      expect(wrapper.find('[data-test="chat-search-count"]').text()).toBe(
        'chatSearch.count {"current":3,"count":3}',
      )
      await wrapper.find('[data-test="chat-search-older"]').trigger('click')
      await field().trigger('keydown', { key: 'Enter' })
      expect(searchSteps).toEqual([-1, -1])
    })

    it('closes on Esc and leaves the window open', async () => {
      mountWindow()
      await magnifier().trigger('click')
      await field().setValue('Bank')
      await field().trigger('keydown', { key: 'Escape' })
      expect(wrapper.find('[data-test="chat-search"]').exists()).toBe(false)
      expect(thread().attributes('data-search')).toBe('')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('closes with the magnifier again', async () => {
      mountWindow()
      await magnifier().trigger('click')
      await magnifier().trigger('click')
      expect(wrapper.find('[data-test="chat-search"]').exists()).toBe(false)
      expect(magnifier().attributes('aria-pressed')).toBe('false')
    })

    // The field goes away with the bar: the keyboard goes back to the magnifier, not nowhere.
    it('gives the keyboard back to the magnifier when the search closes', async () => {
      mountWindow()
      await magnifier().trigger('click')
      const focused = vi.spyOn(magnifier().element, 'focus')
      await field().trigger('keydown', { key: 'Escape' })
      await flushPromises()
      expect(focused).toHaveBeenCalled()
    })

    it('begins unsearched for another person, and after closing', async () => {
      mountWindow()
      await magnifier().trigger('click')
      await field().setValue('Bank')
      await wrapper.setProps({ contact: STRANGER })
      expect(wrapper.find('[data-test="chat-search"]').exists()).toBe(false)
      expect(thread().attributes('data-search')).toBe('')

      await magnifier().trigger('click')
      await field().setValue('Bank')
      await wrapper.setProps({ modelValue: false })
      await wrapper.setProps({ modelValue: true })
      expect(wrapper.find('[data-test="chat-search"]').exists()).toBe(false)
    })

    // The first form (E-055) has nothing to search yet: the magnifier comes with the conversation.
    it('has no magnifier in the first form', async () => {
      mountWindow(
        { user: { ...CONTACT.user }, homeCommunity: true },
        { greet: true, firstContact: true },
      )
      expect(magnifier().exists()).toBe(false)
      await threadSays({ exists: true, mutedByMe: false })
      expect(magnifier().exists()).toBe(true)
    })
  })

  /**
   * E-055 (Bernd, 30.09.2026): opened from a group, a first word is one tap on the arrow --
   * "Hallo …" in the field where the two have never written. For somebody who is no contact yet
   * the window's first form: only the text, until the first message makes them a contact.
   */
  describe("the window's first form, and the greeting", () => {
    // A member of a group as the page hands them over: the pair and the name, no figures.
    const MEMBER = { user: { ...CONTACT.user }, homeCommunity: true }
    const thread = () => wrapper.find('[data-test="chat-thread"]')
    const marks = () =>
      ['contact-window-video', 'contact-window-bell', 'heart'].filter((hook) =>
        wrapper.find(`[data-test="${hook}"]`).exists(),
      )

    it('offers only the text to somebody who is no contact yet, "Hallo …" in the field', async () => {
      mountWindow(MEMBER, { greet: true, firstContact: true })

      expect(wrapper.find('[data-test="contact-window-name"]').text()).toBe('Carla-Sonne')
      expect(wrapper.find('[data-test="contact-window-community"]').text()).toBe('Gradido-Akademie')
      // No meta line either: no figures can come before the first message (and its reserved
      // height stood as an empty band under the head).
      expect(wrapper.find('[data-test="contact-window-meta"]').exists()).toBe(false)
      expect(sendButton().exists()).toBe(false)
      expect(marks()).toEqual([])
      expect(thread().attributes('data-text-only')).toBe('true')
      expect(thread().attributes('data-greeting')).toBe(
        'chatThread.firstContactGreeting {"name":"Carla-Sonne"}',
      )

      // The thread found no conversation: still only the text, and nothing to say.
      await threadSays({ exists: false, mutedByMe: false })
      expect(sendButton().exists()).toBe(false)
      expect(marks()).toEqual([])
      expect(wrapper.emitted('contactMade')).toBeUndefined()
    })

    it('becomes the whole window with the first message, and says so once', async () => {
      mountWindow(MEMBER, { greet: true, firstContact: true })
      await threadSays({ exists: false, mutedByMe: false })

      await threadSays({ exists: true, mutedByMe: false })
      expect(sendButton().exists()).toBe(true)
      expect(wrapper.find('[data-test="contact-window-meta"]').exists()).toBe(true)
      expect(marks()).toEqual(['contact-window-video', 'contact-window-bell', 'heart'])
      expect(thread().attributes('data-text-only')).toBe('false')
      expect(wrapper.emitted('contactMade')).toHaveLength(1)

      await threadSays({ exists: true, mutedByMe: true })
      expect(wrapper.emitted('contactMade')).toHaveLength(1)
    })

    // The page's list was behind: the two have written already. The whole window at once, and the
    // page is told, so that it puts the server's row in.
    it('is the whole window at once where a conversation is there already', async () => {
      mountWindow(MEMBER, { greet: true, firstContact: true })
      await threadSays({ exists: true, mutedByMe: false })

      expect(sendButton().exists()).toBe(true)
      expect(wrapper.emitted('contactMade')).toHaveLength(1)
    })

    it('greets from a group a contact too, in the whole window', async () => {
      mountWindow(CONTACT, { greet: true })

      expect(sendButton().exists()).toBe(true)
      expect(thread().attributes('data-text-only')).toBe('false')
      expect(thread().attributes('data-greeting')).toBe(
        'chatThread.firstContactGreeting {"name":"Carla-Sonne"}',
      )
      await threadSays({ exists: true, mutedByMe: false })
      expect(wrapper.emitted('contactMade')).toBeUndefined()
    })

    it('greets nobody opened from anywhere else', () => {
      mountWindow()

      expect(thread().attributes('data-greeting')).toBe('')
      expect(thread().attributes('data-text-only')).toBe('false')
    })
  })

  it('names the person, their community and their face', () => {
    mountWindow()

    expect(wrapper.find('[data-test="contact-window-name"]').text()).toBe('Carla-Sonne')
    expect(wrapper.find('[data-test="contact-window-community"]').text()).toBe('Gradido-Akademie')
    expect(wrapper.find('[data-test="avatar"]').attributes('data-initials')).toBe('CA')
  })

  // The three numbers come from the same answer as the list: since when, how many, how
  // recently (KF-010).
  it('says since when, how often and how recently', () => {
    const meta = mountWindow().find('[data-test="contact-window-meta"]').text()

    expect(meta).toContain('contacts.since')
    expect(meta).toContain('monthAndYear(2026-07-04T10:00:00.000Z)')
    expect(meta).toContain('contacts.bookings:12')
    expect(meta).toContain('contacts.last')
  })

  /**
   * The two numbers are ONE link into the booking list narrowed to this person (Bernd,
   * 04.09.2026): the newest booking stands on top there, so "how many" and "when was the
   * last" open the same door. "Since when" leads nowhere and is not part of it.
   */
  it('leads from the two numbers into the bookings with this person', () => {
    mountWindow()
    const link = wrapper.find('[data-test="contact-window-bookings"]')

    expect(JSON.parse(link.attributes('data-to'))).toEqual({
      path: '/transactions',
      query: { with: 'carla-id', community: 'home-uuid' },
    })
    expect(link.text()).toContain('contacts.bookings:12')
    expect(link.text()).toContain('contacts.last')
    expect(link.text()).not.toContain('contacts.since')
  })

  it('names the community of a member from elsewhere in that link', () => {
    mountWindow(STRANGER)
    const link = wrapper.find('[data-test="contact-window-bookings"]')
    expect(JSON.parse(link.attributes('data-to')).query).toEqual({
      with: 'sarah-id',
      community: 'provence-uuid',
    })
  })

  // ⛔ Read off the RENDERED text, because that is where it went wrong: Vue deletes a
  // whitespace-only node with a newline between two elements rather than condensing it,
  // and the line read "…07/2026·12 Buchungen · zuletzt…" -- one dot glued, the next spaced.
  it('spaces every separator the same, on both sides', () => {
    const meta = mountWindow().find('[data-test="contact-window-meta"]').text()
    expect(meta).toMatch(/contacts\.since \S+ · contacts\.bookings:12 · contacts\.last/)
  })

  /**
   * The window opened from a BOOKING row (KF-010): that row names the member but knows
   * nothing about how many bookings there were in all, so it arrives as `{ user }` alone
   * and the figures follow from a lookup (useContactWindow.openMember).
   *
   * ⛔ Nothing guessed in the meantime. `new Date(undefined)` prints "Invalid Date" and a
   * plural rule handed no number throws -- so the line is empty until all three are there,
   * and the two buttons, the heart and the name are all fully usable while it is.
   */
  describe('opened on a member whose figures are not in yet', () => {
    const justTheMember = { user: CONTACT.user }

    it('says nothing rather than guessing, and offers no way into the bookings', () => {
      mountWindow(justTheMember)

      expect(wrapper.find('[data-test="contact-window-meta"]').text()).toBe('')
      expect(wrapper.find('[data-test="contact-window-bookings"]').exists()).toBe(false)
    })

    // ⚠️ The empty line KEEPS ITS PLACE. Letting it collapse moved both buttons up a line
    // and dropped them back down when the answer landed -- under a finger already on its
    // way to one of them.
    it('holds the line open so nothing under it moves when the figures land', () => {
      mountWindow(justTheMember)

      expect(wrapper.find('[data-test="contact-window-meta"]').exists()).toBe(true)
    })

    it('still names the member and still offers to send them Gradido', () => {
      mountWindow(justTheMember)

      expect(wrapper.find('[data-test="contact-window-name"]').text()).toBe('Carla-Sonne')
      expect(sendButton().exists()).toBe(true)
    })

    // The address hangs off `homeCommunity`, which a booking row does not carry either --
    // and an address invented for the wrong host is what that line exists to prevent.
    it('leaves the address away until the lookup says whose community it is', () => {
      mountWindow(justTheMember)

      expect(wrapper.find('[data-test="contact-window-address"]').exists()).toBe(false)
    })

    it('shows the whole line once the figures arrive', async () => {
      mountWindow(justTheMember)
      await wrapper.setProps({ contact: CONTACT })

      expect(wrapper.find('[data-test="contact-window-meta"]').text()).toMatch(
        /contacts\.since \S+ · contacts\.bookings:12 · contacts\.last/,
      )
      expect(wrapper.find('[data-test="contact-window-bookings"]').exists()).toBe(true)
    })

    // The thread needs the pair and nothing else, so it does not wait for the lookup that
    // brings the figures -- the member reads while the line above is still empty.
    it('already has the thread, before the figures are in', () => {
      mountWindow(justTheMember)
      const thread = wrapper.find('[data-test="chat-thread"]')

      expect(thread.exists()).toBe(true)
      expect(thread.attributes('data-who')).toBe('carla-id')
    })

    // ⛔ And it is the SAME thread afterwards: the figures landing is not a new person, and a
    // new thread would ask the server again and flash an empty box under a reading eye.
    it('keeps that thread when the figures land', async () => {
      mountWindow(justTheMember)
      await wrapper.setProps({ contact: CONTACT })

      expect(threadsMade).toEqual(['carla-id'])
    })

    /**
     * ⛔ Also where the row named the member WITHOUT a community and the lookup brings it
     * (LOG-036): null is this community, the server reads it so, and the key writes it so. It
     * made a new thread before -- asked the server again, and dropped a bell's answer on its way.
     */
    it('keeps the thread when the lookup fills in the community', async () => {
      mountWindow({ user: { ...CONTACT.user, communityUuid: null } })
      expect(wrapper.find('[data-test="chat-thread"]').attributes('data-key')).toBe(
        'home-uuid/carla-id',
      )

      await wrapper.setProps({ contact: CONTACT })

      expect(threadsMade).toEqual(['carla-id'])
      expect(wrapper.find('[data-test="chat-thread"]').attributes('data-key')).toBe(
        'home-uuid/carla-id',
      )
    })

    // …and an answer about the bell that was on its way still lands: it is the same person.
    it('still hears the bell answer that was on its way while the community came in', async () => {
      let answer
      serverMutes.mockImplementation(
        () =>
          new Promise((resolve) => {
            answer = resolve
          }),
      )
      mountWindow({ user: { ...CONTACT.user, communityUuid: null } })
      await threadSays({ exists: true, mutedByMe: false })
      await bell().trigger('click')

      await wrapper.setProps({ contact: CONTACT })
      answer({ data: { setChatConversationMuted: true } })
      await flushPromises()

      expect(bell().attributes('aria-pressed')).toBe('true')
      expect(toastSuccess).toHaveBeenCalledWith('chatThread.mutedHint {"name":"Carla-Sonne"}')
    })
  })

  /**
   * The second source of the contact list (KF-012): somebody who came here over this member,
   * or who showed it to them. The window has the room the row does not, so where there are
   * both a count and an origin it says both.
   */
  describe('a contact off the referral trace', () => {
    const ARRIVED = { ...CONTACT, bookings: 0, origin: 'ARRIVAL' }

    it('says since when and how they met, and nothing about bookings', () => {
      mountWindow(ARRIVED)
      const meta = wrapper.find('[data-test="contact-window-meta"]').text()

      expect(meta).toContain('contacts.since')
      expect(wrapper.find('[data-test="contact-window-origin"]').text()).toBe(
        'contacts.origin.arrival',
      )
      expect(meta).not.toContain('contacts.bookings')
      expect(meta).not.toContain('contacts.last')
    })

    /**
     * ⛔ And no door onto an empty room. Narrowed to somebody with no bookings the list
     * behind this link has no rows -- the server says so in ContactResolver.test -- so the
     * link would open a page that says "nothing here" about a person one is looking at.
     */
    it('offers no way into a booking list that has nothing in it', () => {
      mountWindow(ARRIVED)
      expect(wrapper.find('[data-test="contact-window-bookings"]').exists()).toBe(false)
      // Gegenprobe: the same window WITH bookings does offer it, so the assertion above
      // measures the zero and not a link that has gone missing everywhere.
      wrapper.unmount()
      mountWindow({ ...CONTACT, origin: 'ARRIVAL' })
      expect(wrapper.find('[data-test="contact-window-bookings"]').exists()).toBe(true)
    })

    it('shows BOTH lines for somebody who is a counterparty and an arrival', () => {
      mountWindow({ ...CONTACT, origin: 'ARRIVAL' })
      const meta = wrapper.find('[data-test="contact-window-meta"]').text()

      expect(meta).toContain('contacts.since')
      expect(meta).toContain('contacts.bookings:12')
      expect(wrapper.find('[data-test="contact-window-origin"]').text()).toBe(
        'contacts.origin.arrival',
      )
    })

    it('says it the other way round for whoever showed this member Gradido', () => {
      mountWindow({ ...CONTACT, bookings: 0, origin: 'REFERRER' })
      expect(wrapper.find('[data-test="contact-window-origin"]').text()).toBe(
        'contacts.origin.referrer',
      )
    })

    // ⚠️ A server one version ahead could name an origin this wallet has no word for.
    it('draws no origin line for a value it does not know', () => {
      mountWindow({ ...CONTACT, bookings: 0, origin: 'SOMETHING_NEW' })
      expect(wrapper.find('[data-test="contact-window-origin"]').exists()).toBe(false)
    })
  })

  /**
   * ⛔ The meta block must not COLLAPSE while the figures are on their way: it used to move
   * both buttons up a line and drop them back down under a finger already reaching for one.
   * The reservation lives in the stylesheet, which is the only place jsdom lets it be seen,
   * and nothing else holds it -- the empty-line test above passes with or without the rule.
   *
   * ⚠️ Comments stripped first. The rule is explained in prose right beside it, and a search
   * over the raw text would find its own explanation and survive the deletion.
   */
  it('reserves the height of the meta line in the stylesheet', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ContactWindow.vue'),
      'utf8',
    )
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '')
    const meta = code.match(/\.contact-window-meta\s*\{[^}]*\}/)

    expect(meta, '.contact-window-meta no longer exists').not.toBeNull()
    expect(meta[0]).toMatch(/min-height:\s*[\d.]+em/)
    // Gegenprobe on the stripping itself: the phrase stands in comments as well as in rules,
    // so there are fewer of it once the comments are gone. (Counted against the raw text
    // rather than as "exactly one": the grips have a `min-height` of their own now.)
    expect(source.match(/min-height/g).length).toBeGreaterThan(code.match(/min-height/g).length)
  })

  it('closes on the way into the bookings, as it does for the send form', async () => {
    mountWindow()
    await wrapper.find('[data-test="contact-window-bookings"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  // A cmd-click opens the bookings in a NEW tab and leaves this one where it is -- so the
  // window stays too; closing it left the member with nothing to look at here.
  it('stays open when the click opens the bookings elsewhere', async () => {
    mountWindow()
    await wrapper.find('[data-test="contact-window-bookings"]').trigger('click', { metaKey: true })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  // The button: the send form with the person already named, as the map's profile window opens it.
  it('sends Gradido to the send form, with the person already named', async () => {
    mountWindow()
    await sendButton().trigger('click')

    // ⛔ The mode is named although only this way is left. This window stands beside /send,
    // so a tap only changes the params and the query -- the form is patched, not rebuilt --
    // and without it a form already in e-mail mode would stay there.
    expect(pushSpy).toHaveBeenCalledWith({
      path: '/send/home-uuid/carla-id',
      query: { art: 'send' },
    })
  })

  it('sends a member of another community down the same road', async () => {
    mountWindow(STRANGER)
    await sendButton().trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      path: '/send/provence-uuid/sarah-id',
      query: { art: 'send' },
    })
  })

  it('closes itself on the way out, so it is not standing open behind the form', async () => {
    mountWindow()
    await sendButton().trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  /**
   * ⛔ No "send e-mail" in the window any more (E-031): the short mail is the compose bar's
   * box, the long one the send form's tab. The key is gone with the button -- read in the
   * source, comments stripped, so a leftover in a comment does not count and one in code does.
   */
  it('has no e-mail button and no word for one', () => {
    mountWindow()
    expect(wrapper.find('[data-test="contact-window-email"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="contact-window-send-ways"]').exists()).toBe(false)
    expect(styleOf('ContactWindow.vue')).not.toContain('contacts.sendEmail')
  })

  /**
   * The name has its line to itself (Bernd, 26.09.2026): the marks that stood behind it took a
   * long name's room on a phone, and went down beside the send button.
   */
  it('gives the name its line to itself', async () => {
    mountWindow()
    await threadSays({ exists: true, mutedByMe: false })
    const who = wrapper.find('.contact-window-who')

    expect(who.find('[data-test="contact-window-name"]').text()).toBe('Carla-Sonne')
    for (const mark of ['heart', 'contact-window-bell', 'contact-window-video']) {
      expect(who.find(`[data-test="${mark}"]`).exists(), mark).toBe(false)
    }
  })

  /**
   * Beside the send button, at the right end of its row, in Bernd's order (26.09.2026): the
   * camera, the bell, the heart. The heart at the very right, where it stands in every list --
   * the same component (E-030); the bell next to it, both marks of one's own on this person; the
   * camera next to the button, as it too is a way of getting in touch. The order of the DOM is
   * the order a keyboard reaches them in: the button first.
   */
  it('puts camera, bell and heart at the right of the send button, in this order', async () => {
    mountWindow()
    await threadSays({ exists: true, mutedByMe: false })

    const [button, marks] = wrapper.find('.contact-window-send').element.children
    expect(button.getAttribute('data-test')).toBe('contact-window-send')
    expect(marks.getAttribute('data-test')).toBe('contact-window-marks')
    expect([...marks.children].map((e) => e.getAttribute('data-test'))).toEqual([
      'contact-window-video',
      'contact-window-bell',
      'heart',
    ])
    expect(marks.lastElementChild.getAttribute('data-id')).toBe('carla-id')
  })

  // Before the first message there is no bell (E-024), and the heart stays at the right end.
  it('keeps the heart at the right end where there is no bell', async () => {
    mountWindow()
    await threadSays({ exists: false, mutedByMe: false })

    const marks = wrapper.find('[data-test="contact-window-marks"]').element
    expect([...marks.children].map((e) => e.getAttribute('data-test'))).toEqual([
      'contact-window-video',
      'heart',
    ])
  })

  // Before the first message there is nothing to mute (E-024), and nothing is known before the
  // thread has said so.
  it('shows the bell only where there is a conversation', async () => {
    mountWindow()
    expect(bell().exists()).toBe(false)

    await threadSays({ exists: false, mutedByMe: false })
    expect(bell().exists()).toBe(false)

    await threadSays({ exists: true, mutedByMe: false })
    expect(bell().exists()).toBe(true)
  })

  // Another person is another conversation: nothing of the last one's bell stays up.
  it('forgets the bell of the person before', async () => {
    mountWindow()
    await threadSays({ exists: true, mutedByMe: true })
    expect(bell().exists()).toBe(true)

    await wrapper.setProps({ contact: STRANGER })

    expect(bell().exists()).toBe(false)
  })

  /**
   * One way out, with its word (Bernd, 24.09.2026, at the device: the coin alone behind the
   * name was not taken for a button), under the figures and above the line where the thread
   * begins -- and no "Send e-mail" beside it. The marks share its row (26.09.2026), without a
   * word of their own.
   */
  it('offers one way out, with its word, under the figures and above the thread', async () => {
    mountWindow()
    await threadSays({ exists: true, mutedByMe: false })
    const row = wrapper.find('.contact-window-send')
    const meta = wrapper.find('[data-test="contact-window-meta"]').element
    const thread = wrapper.find('[data-test="chat-thread"]').element

    expect(row.element.children).toHaveLength(2)
    expect(sendButton().text()).toBe('contacts.sendGradido')
    expect(row.text()).toBe('contacts.sendGradido')
    expect(meta.compareDocumentPosition(row.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(row.element.compareDocumentPosition(thread) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(wrapper.find('[data-test="contact-window-coin"]').exists()).toBe(false)
  })

  // The send form's own white coin, as on the map's button; the word says it, so the glyph is
  // hidden from a screen reader.
  it('shows the white coin of the send form on it', () => {
    mountWindow()
    const glyph = sendButton().find('img')

    expect(glyph.attributes('src')).toBe('/img/svg/gdd_coin_sw.svg')
    expect(glyph.attributes('alt')).toBe('')
    expect(glyph.attributes('aria-hidden')).toBe('true')
  })

  describe('the bell', () => {
    it('says whether the conversation is muted, in state and in name', async () => {
      mountWindow()
      await threadSays({ exists: true, mutedByMe: true })
      expect(bell().attributes('aria-pressed')).toBe('true')
      expect(bell().attributes('aria-label')).toBe('chatThread.muteOff {"name":"Carla-Sonne"}')
      expect(bell().attributes('title')).toBe('chatThread.muteOff {"name":"Carla-Sonne"}')
      expect(bell().classes()).toContain('is-muted')
      wrapper.unmount()

      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })
      expect(bell().attributes('aria-pressed')).toBe('false')
      expect(bell().attributes('aria-label')).toBe('chatThread.muteOn')
      expect(bell().classes()).not.toContain('is-muted')
    })

    /**
     * Switched here first and confirmed by the server after, as the heart does it; what it
     * means is said once, as a hint (E-031). The pair as the thread asks with it.
     */
    it('mutes by the pair, switches at once and says what it means', async () => {
      let answer
      serverMutes.mockImplementation(
        () =>
          new Promise((resolve) => {
            answer = resolve
          }),
      )
      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })

      await bell().trigger('click')
      expect(bell().attributes('aria-pressed')).toBe('true')
      expect(serverMutes).toHaveBeenCalledWith({
        ref: { gradidoID: 'carla-id', communityUuid: 'home-uuid' },
        muted: true,
      })

      answer({ data: { setChatConversationMuted: true } })
      await flushPromises()
      expect(toastSuccess).toHaveBeenCalledWith('chatThread.mutedHint {"name":"Carla-Sonne"}')
      expect(bell().attributes('aria-pressed')).toBe('true')
    })

    it('lifts it the same way, and says that too', async () => {
      serverMutes.mockResolvedValue({ data: { setChatConversationMuted: true } })
      mountWindow({ ...CONTACT, user: { ...CONTACT.user, communityUuid: null } })
      await threadSays({ exists: true, mutedByMe: true })

      await bell().trigger('click')
      await flushPromises()

      expect(serverMutes).toHaveBeenCalledWith({
        ref: { gradidoID: 'carla-id', communityUuid: null },
        muted: false,
      })
      expect(bell().attributes('aria-pressed')).toBe('false')
      expect(toastSuccess).toHaveBeenCalledWith('chatThread.unmutedHint {"name":"Carla-Sonne"}')
    })

    it('goes back and says so where the server fails', async () => {
      serverMutes.mockRejectedValue(new Error('Network error'))
      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })

      await bell().trigger('click')
      await flushPromises()

      expect(bell().attributes('aria-pressed')).toBe('false')
      expect(toastError).toHaveBeenCalledWith('Network error')
      expect(toastSuccess).not.toHaveBeenCalled()
    })

    // `false` is no error but no change: there was no conversation to mark. Back, without a
    // hint that would claim a change.
    it('goes back without a word where the server changed nothing', async () => {
      serverMutes.mockResolvedValue({ data: { setChatConversationMuted: false } })
      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })

      await bell().trigger('click')
      await flushPromises()

      expect(bell().attributes('aria-pressed')).toBe('false')
      expect(toastSuccess).not.toHaveBeenCalled()
      expect(toastError).not.toHaveBeenCalled()
    })

    // One switch at a time: a second tap while the first is on its way is turned away.
    it('takes no second tap while the first is on its way', async () => {
      serverMutes.mockImplementation(() => new Promise(() => {}))
      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })

      await bell().trigger('click')
      await bell().trigger('click')

      expect(serverMutes).toHaveBeenCalledTimes(1)
      expect(bell().attributes('aria-pressed')).toBe('true')
    })

    /**
     * The window stays and the person in it changes: an answer about the bell of the person
     * before that comes back late changes nothing here, neither the bell nor a word
     * (coderabbit, PR #3974).
     */
    it('lets a late answer for the person before change nothing', async () => {
      const answers = []
      serverMutes.mockImplementation(
        () => new Promise((resolve, reject) => answers.push({ resolve, reject })),
      )
      mountWindow()
      await threadSays({ exists: true, mutedByMe: true })
      await bell().trigger('click')

      await wrapper.setProps({ contact: STRANGER })
      await threadSays({ exists: true, mutedByMe: false })
      answers[0].reject(new Error('Network error'))
      await flushPromises()

      expect(bell().attributes('aria-pressed')).toBe('false')
      expect(toastError).not.toHaveBeenCalled()
      expect(toastSuccess).not.toHaveBeenCalled()
    })

    // …and it holds up nothing here, nor lets go of the one switch at a time for the next person.
    it('is not held up by the answer for the person before, nor let go by it', async () => {
      const answers = []
      serverMutes.mockImplementation(() => new Promise((resolve) => answers.push(resolve)))
      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })
      await bell().trigger('click')

      await wrapper.setProps({ contact: STRANGER })
      await threadSays({ exists: true, mutedByMe: false })
      await bell().trigger('click')
      expect(serverMutes).toHaveBeenCalledTimes(2)
      expect(serverMutes).toHaveBeenLastCalledWith({
        ref: { gradidoID: 'sarah-id', communityUuid: 'provence-uuid' },
        muted: true,
      })

      answers[0]({ data: { setChatConversationMuted: true } })
      await flushPromises()
      await bell().trigger('click')

      expect(serverMutes).toHaveBeenCalledTimes(2)
      expect(bell().attributes('aria-pressed')).toBe('true')
      expect(toastSuccess).not.toHaveBeenCalled()
    })

    // The window knows the conversation by the pair the thread is keyed by (KF-004): the same
    // id in another community is another conversation (coderabbit, PR #3974).
    it('takes the same id in another community for another conversation', async () => {
      const answers = []
      serverMutes.mockImplementation(
        () => new Promise((resolve, reject) => answers.push({ resolve, reject })),
      )
      mountWindow()
      await threadSays({ exists: true, mutedByMe: true })
      await bell().trigger('click')

      await wrapper.setProps({
        contact: { ...CONTACT, user: { ...CONTACT.user, communityUuid: 'provence-uuid' } },
      })
      expect(bell().exists()).toBe(false)
      await threadSays({ exists: true, mutedByMe: false })
      answers[0].reject(new Error('Network error'))
      await flushPromises()

      expect(bell().attributes('aria-pressed')).toBe('false')
      expect(toastError).not.toHaveBeenCalled()
    })

    /**
     * ⚠️ A window that only closed lets the contact go (useContactWindow), and that is no other
     * person: the hint still says what became of the person just seen.
     */
    it('still says what became of the bell when the window only closed', async () => {
      let answer
      serverMutes.mockImplementation(
        () =>
          new Promise((resolve) => {
            answer = resolve
          }),
      )
      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })
      await bell().trigger('click')

      await wrapper.setProps({ contact: null })
      answer({ data: { setChatConversationMuted: true } })
      await flushPromises()

      expect(toastSuccess).toHaveBeenCalledWith('chatThread.mutedHint {"name":"Carla-Sonne"}')
    })
  })

  describe('the video call', () => {
    const camera = () => wrapper.find('[data-test="contact-window-video"]')
    const dialog = () => wrapper.find('[data-test="chat-video-dialog"]')
    const inDialog = (name) => wrapper.find(`[data-test="chat-video-${name}"]`)

    /** A room as the server hands it out (V1): address, host, and who runs the server. */
    const ROOM = {
      url: 'https://meet.ffmuc.net/k7m2x9q4t8wz',
      host: 'meet.ffmuc.net',
      operator: 'Freifunk München (Freie Netze München e. V.)',
    }
    /**
     * The room with the default topic added (V4a) -- the form tried on two servers (Notiz §12).
     * Every call carries a topic: this is the address the invitation, the room's window and the
     * link in the dialog get when the field is left as it is.
     */
    const ROOM_WITH_DEFAULT = 'https://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Videoanruf%22'
    const topicField = () => wrapper.find('[data-test="chat-video-topic"]')

    /**
     * The room's window as `window.open` hands it back: it can be sent to an address and
     * closed, and it says whether it still reaches back to the wallet (`opener`).
     */
    let room
    let opens
    const browserOpens = (answer) => {
      room = { opener: window, closed: false, location: { href: '' }, close: vi.fn() }
      opens = vi.spyOn(window, 'open').mockImplementation(() => (answer === null ? null : room))
    }

    /** The question open, for a person with or without a conversation so far. */
    const asked = async ({ exists = true } = {}) => {
      mountWindow()
      await threadSays({ exists, mutedByMe: false })
      await camera().trigger('click')
    }

    /** "Start call", pressed and let run to its end. */
    const start = async () => {
      await inDialog('start').trigger('click')
      await flushPromises()
    }

    /** A promise the test lets go of when it wants: what is on its way stays on its way. */
    const held = () => {
      let release
      const promise = new Promise((resolve) => {
        release = resolve
      })
      return { promise, release }
    }

    // Unlike the bell: nothing is known before the thread has said so, and a call may be how a
    // conversation begins -- so the camera stands once the thread has spoken, with or without one.
    it('stands once the thread has said what it knows, with a conversation or without', async () => {
      mountWindow()
      expect(camera().exists()).toBe(false)

      await threadSays({ exists: false, mutedByMe: false })
      expect(camera().exists()).toBe(true)
      expect(bell().exists()).toBe(false)

      await threadSays({ exists: true, mutedByMe: false })
      expect(camera().exists()).toBe(true)
    })

    // coderabbit, #4015: the window closed while the invitation was on its way -- the call is let
    // go as a cancel lets it go: the empty window closes, and no room is entered afterwards.
    it('lets the call go when the window is gone while the invitation is on its way', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      const delivery = held()
      threadDelivers.mockReturnValue(delivery.promise)
      await asked()
      await inDialog('start').trigger('click')
      await flushPromises()
      expect(threadDelivers).toHaveBeenCalledTimes(1)

      wrapper.unmount()
      expect(room.close).toHaveBeenCalled()

      delivery.release(true)
      await flushPromises()
      expect(room.location.href).toBe('')
    })

    it('is gone again for the next person, until their thread has spoken', async () => {
      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })
      expect(camera().exists()).toBe(true)

      await wrapper.setProps({ contact: STRANGER })
      expect(camera().exists()).toBe(false)

      await threadSays({ exists: false, mutedByMe: false })
      expect(camera().exists()).toBe(true)
    })

    // One of the marks: the bell's round button, its size, its focus ring (the stylesheet test
    // below), and a name that says what a tap starts -- the glyph says nothing to a screen
    // reader.
    it('is a button a keyboard reaches, named by what it starts and with whom', async () => {
      mountWindow()
      await threadSays({ exists: false, mutedByMe: false })

      expect(camera().element.tagName).toBe('BUTTON')
      expect(camera().attributes('type')).toBe('button')
      expect(camera().attributes('tabindex')).toBeUndefined()
      expect(camera().classes()).toContain('contact-window-mark')
      expect(camera().attributes('aria-label')).toBe('chatThread.videoCall {"name":"Carla-Sonne"}')
      expect(camera().attributes('title')).toBe('chatThread.videoCall {"name":"Carla-Sonne"}')
    })

    it('asks first, and names the dialog by its question', async () => {
      await asked()

      expect(dialog().exists()).toBe(true)
      expect(inDialog('title').text()).toBe('chatThread.videoAskTitle {"name":"Carla-Sonne"}')
      expect(dialog().attributes('aria-label')).toBe(
        'chatThread.videoAskTitle {"name":"Carla-Sonne"}',
      )
      expect(inDialog('cancel').text()).toBe('form.cancel')
      expect(inDialog('start').text()).toBe('chatThread.videoStart')
    })

    // E-024: the first message of a pair goes by mail in any case -- nothing to choose, and the
    // sentence says so. After it, the box, empty.
    it('says the first message goes by mail as well, and offers no box for it', async () => {
      await asked({ exists: false })

      expect(inDialog('body').text()).toBe('chatThread.videoAskFirst {"name":"Carla-Sonne"}')
      expect(inDialog('email').exists()).toBe(false)
    })

    it('offers the box after the first message, empty', async () => {
      await asked({ exists: true })

      expect(inDialog('body').text()).toBe('chatThread.videoAskBody {"name":"Carla-Sonne"}')
      expect(inDialog('email').element.checked).toBe(false)
      // The compose bar's words -- a group's question says "to everybody" instead (E-053).
      expect(inDialog('email').element.closest('label').textContent.trim()).toBe(
        'chatThread.alsoByEmail',
      )
    })

    it('empties the box again for the next question', async () => {
      await asked({ exists: true })
      await inDialog('email').setValue(true)
      await inDialog('cancel').trigger('click')

      await camera().trigger('click')
      expect(inDialog('email').element.checked).toBe(false)
    })

    // V4a: the topic, filled in with the default for every question -- so "Start call" stays the
    // one click it was -- and nothing of the last question kept.
    it('fills the topic in with the default, and again for every question', async () => {
      await asked()
      expect(topicField().element.value).toBe('Videoanruf')

      await topicField().setValue('Lesekreis')
      await inDialog('cancel').trigger('click')
      await camera().trigger('click')

      expect(topicField().element.value).toBe('Videoanruf')
    })

    // Between the title and the sentence: a named text field, forty characters at most (the
    // topic stands encoded in the link), and under it the hint about who can read it -- tied to
    // the field, so a screen reader says it with the field.
    it('offers a named field for the topic, with the hint tied to it', async () => {
      await asked()

      const field = topicField()
      const label = wrapper.find(`label[for="${field.attributes('id')}"]`)
      const hint = inDialog('topic-hint')
      expect(field.element.tagName).toBe('INPUT')
      expect(field.attributes('type')).toBe('text')
      expect(field.attributes('id')).toBeTruthy()
      expect(label.text()).toBe('chatThread.videoTopic')
      expect(hint.text()).toBe('chatThread.videoTopicHint')
      expect(hint.attributes('id')).toBeTruthy()
      expect(field.attributes('aria-describedby')).toBe(hint.attributes('id'))
      expect(field.attributes('autocomplete')).toBe('off')

      const order = [...dialog().element.querySelectorAll('[data-test]')].map((element) =>
        element.getAttribute('data-test'),
      )
      expect(order.indexOf('chat-video-title')).toBeLessThan(order.indexOf('chat-video-topic'))
      expect(order.indexOf('chat-video-topic-hint')).toBeLessThan(order.indexOf('chat-video-body'))
    })

    /**
     * ⛔ No focus of its own. The real dialog's focus trap focuses the first element Tab reaches
     * as it switches on -- measured in Chrome, the field had the focus for 70 ms of every opening,
     * enough for a phone's keyboard. So the field is out of the tab order until the dialog says it
     * is open (`shown`); a tap focuses it all the same, and afterwards Tab reaches it.
     */
    it('keeps the field out of the tab order until the question is open, for every question', async () => {
      const question = () =>
        wrapper
          .findAllComponents({ name: 'BModal' })
          .find((modal) => modal.attributes('data-test') === 'chat-video-dialog')
      await asked()
      expect(topicField().attributes('tabindex')).toBe('-1')

      question().vm.$emit('shown')
      await flushPromises()
      expect(topicField().attributes('tabindex')).toBeUndefined()

      await inDialog('cancel').trigger('click')
      await camera().trigger('click')
      expect(topicField().attributes('tabindex')).toBe('-1')
    })

    it('takes forty characters in the field', async () => {
      await asked()

      expect(topicField().attributes('maxlength')).toBe('40')
    })

    // Typing replaces the default: the field marks what it holds when it gets the focus.
    it('marks the topic when the field gets the focus', async () => {
      await asked()
      const field = topicField().element
      field.setSelectionRange(3, 3)

      await topicField().trigger('focus')

      expect(field.selectionStart).toBe(0)
      expect(field.selectionEnd).toBe('Videoanruf'.length)
    })

    it('lets the question go on cancel, and makes no room', async () => {
      browserOpens()
      await asked()

      await inDialog('cancel').trigger('click')

      expect(dialog().exists()).toBe(false)
      expect(opens).not.toHaveBeenCalled()
      expect(serverRooms).not.toHaveBeenCalled()
    })

    /**
     * ⛔ The room's window is opened IN THE CLICK, before anything is awaited: a browser lets a
     * page open a window only in answer to a tap. The press is dispatched by hand and nothing
     * is awaited before the window is asked about -- a window opened after the first `await`
     * would not have been opened yet here.
     */
    it('opens the window for the room in the click itself, and cuts it off from the wallet', async () => {
      browserOpens()
      serverRooms.mockReturnValue(held().promise)
      await asked()

      inDialog('start').element.click()

      expect(opens).toHaveBeenCalledTimes(1)
      expect(opens).toHaveBeenCalledWith('', '_blank')
      expect(room.opener).toBeNull()
      expect(room.location.href).toBe('')
    })

    // Every call is another room; one out of the cache would put two conversations into one.
    it('asks for the room past the cache', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()

      await start()

      expect(serverRooms).toHaveBeenCalledTimes(1)
      expect(serverRooms).toHaveBeenCalledWith({ query: chatVideoRoom, fetchPolicy: 'no-cache' })
    })

    /**
     * The invitation: the words in the sender's language, who runs the server, the address
     * last -- through the thread of THIS person, with the wish the box stands for.
     */
    it('sends the invitation through the thread, naming who runs the server', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked({ exists: true })

      await start()

      expect(threadDelivers).toHaveBeenCalledTimes(1)
      expect(threadDelivers).toHaveBeenCalledWith(
        {
          body: `chatThread.videoInvite ${JSON.stringify({ operator: ROOM.operator, url: ROOM_WITH_DEFAULT })}`,
          notify: 'NONE',
        },
        'carla-id',
      )
    })

    // Where the list names nobody, the invitation names the server's host.
    it("names the server's host where nobody is named as running it", async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: { ...ROOM, operator: null } } })
      threadDelivers.mockResolvedValue(true)
      await asked()

      await start()

      expect(threadDelivers.mock.calls[0][0].body).toBe(
        `chatThread.videoInvite ${JSON.stringify({ operator: ROOM.host, url: ROOM_WITH_DEFAULT })}`,
      )
    })

    /**
     * A topic of one's own (V4a): the invitation names it in words, on a line of its own, and
     * the address carries it for Jitsi -- the SAME address in the invitation and in the room's
     * window, made once.
     */
    it('names a topic of its own in the invitation, and sends the room to the same address', async () => {
      const topic = 'Lesekreis „Momo“'
      const address = withChatVideoTopic(ROOM.url, topic)
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()
      await topicField().setValue(topic)

      await start()

      expect(address).not.toBe(ROOM_WITH_DEFAULT)
      expect(threadDelivers.mock.calls[0][0].body).toBe(
        `chatThread.videoInviteTopic ${JSON.stringify({ topic, operator: ROOM.operator, url: address })}`,
      )
      expect(room.location.href).toBe(address)
    })

    it('offers the same address as a link where the browser held the window back', async () => {
      const topic = 'Gespräch über Bäume'
      browserOpens(null)
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()
      await topicField().setValue(topic)

      await start()

      const address = withChatVideoTopic(ROOM.url, topic)
      expect(threadDelivers.mock.calls[0][0].body).toContain(JSON.stringify(address))
      expect(inDialog('open').attributes('href')).toBe(address)
    })

    // The address never goes without its addition (V4b will know an invitation by it): an
    // emptied field, or one of spaces only, is the default.
    it.each([
      ['emptied', ''],
      ['holding only spaces', '   '],
    ])('takes the default where the field is %s', async (_, typed) => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()
      await topicField().setValue(typed)

      await start()

      expect(threadDelivers.mock.calls[0][0].body).toBe(
        `chatThread.videoInvite ${JSON.stringify({ operator: ROOM.operator, url: ROOM_WITH_DEFAULT })}`,
      )
      expect(room.location.href).toBe(ROOM_WITH_DEFAULT)
    })

    it('trims the topic it sends', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()
      await topicField().setValue('  Lesekreis  ')

      await start()

      expect(room.location.href).toBe(withChatVideoTopic(ROOM.url, 'Lesekreis'))
    })

    // What the field said at the press is the call's topic: typing while the room is on its way
    // changes nothing about the invitation that goes out.
    it('takes the topic as the field held it at the press', async () => {
      browserOpens()
      const offer = held()
      serverRooms.mockReturnValue(offer.promise)
      threadDelivers.mockResolvedValue(true)
      await asked()
      await topicField().setValue('Lesekreis')

      await inDialog('start').trigger('click')
      await topicField().setValue('Etwas anderes')
      offer.release({ data: { chatVideoRoom: ROOM } })
      await flushPromises()

      const address = withChatVideoTopic(ROOM.url, 'Lesekreis')
      expect(threadDelivers.mock.calls[0][0].body).toBe(
        `chatThread.videoInviteTopic ${JSON.stringify({ topic: 'Lesekreis', operator: ROOM.operator, url: address })}`,
      )
      expect(room.location.href).toBe(address)
    })

    // The default in the words of the moment -- in English "Video call": it fills the field, and
    // as the default it leaves the invitation reading as it always did.
    it('fills in the default, and knows it, in the words of the moment', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      words['chatThread.videoTopicDefault'] = 'Video call'
      try {
        await asked()
        expect(topicField().element.value).toBe('Video call')
        await start()
      } finally {
        words['chatThread.videoTopicDefault'] = 'Videoanruf'
      }

      const address = withChatVideoTopic(ROOM.url, 'Video call')
      expect(address).toContain('#config.subject=%22Video%20call%22')
      expect(threadDelivers.mock.calls[0][0].body).toBe(
        `chatThread.videoInvite ${JSON.stringify({ operator: ROOM.operator, url: address })}`,
      )
    })

    // E-024: the first message of a pair asks for a mail, and after it the box decides.
    it('asks for a mail with the first message, and after it where the box is ticked', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)

      await asked({ exists: false })
      await start()
      expect(threadDelivers.mock.calls.at(-1)[0].notify).toBe('EMAIL')
      wrapper.unmount()

      await asked({ exists: true })
      await inDialog('email').setValue(true)
      await start()
      expect(threadDelivers.mock.calls.at(-1)[0].notify).toBe('EMAIL')
    })

    /**
     * ⛔ The room is entered only once the invitation went out: a room nobody else knows is not
     * entered. Until then the window stays empty.
     */
    it('sends the window to the room only once the invitation went out, and closes the question', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      const delivery = held()
      threadDelivers.mockReturnValue(delivery.promise)
      await asked()

      await inDialog('start').trigger('click')
      await flushPromises()
      expect(threadDelivers).toHaveBeenCalledTimes(1)
      expect(room.location.href).toBe('')
      expect(dialog().exists()).toBe(true)

      delivery.release(true)
      await flushPromises()

      expect(room.location.href).toBe(ROOM_WITH_DEFAULT)
      expect(room.close).not.toHaveBeenCalled()
      expect(dialog().exists()).toBe(false)
    })

    it('closes the window and says so where no video server can be had', async () => {
      browserOpens()
      serverRooms.mockRejectedValue(new Error('CHAT_VIDEO_NO_SERVER'))
      await asked()

      await start()

      expect(room.close).toHaveBeenCalledTimes(1)
      expect(room.location.href).toBe('')
      expect(threadDelivers).not.toHaveBeenCalled()
      expect(inDialog('problem').text()).toBe('chatThread.videoNoServer')
      expect(inDialog('problem').attributes('role')).toBe('alert')
      expect(dialog().exists()).toBe(true)
    })

    it('closes the window and says so where the room could not be had for another reason', async () => {
      browserOpens()
      serverRooms.mockRejectedValue(new Error('Network error'))
      await asked()

      await start()

      expect(room.close).toHaveBeenCalledTimes(1)
      expect(threadDelivers).not.toHaveBeenCalled()
      expect(inDialog('problem').text()).toBe('chatThread.videoNotSent')
    })

    // The thread says false where the server gave no copy back, and where the copy came back
    // FAILED -- nobody on the other side has the room then.
    it('closes the window and says so where the invitation did not go out', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(false)
      await asked()

      await start()

      expect(room.close).toHaveBeenCalledTimes(1)
      expect(room.location.href).toBe('')
      expect(inDialog('problem').text()).toBe('chatThread.videoNotSent')
      expect(dialog().exists()).toBe(true)
    })

    it('can be started again after it did not come about', async () => {
      browserOpens()
      serverRooms.mockRejectedValueOnce(new Error('CHAT_VIDEO_NO_SERVER'))
      serverRooms.mockResolvedValueOnce({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()
      await start()

      await start()

      expect(opens).toHaveBeenCalledTimes(2)
      expect(threadDelivers).toHaveBeenCalledTimes(1)
      expect(room.location.href).toBe(ROOM_WITH_DEFAULT)
    })

    /**
     * The browser held the window back (a popup blocker): the invitation still went out, and
     * the member opens the room from the dialog with a tap of their own. Nothing offers to start
     * the call a second time -- that would be a second room and a second message.
     */
    it('offers the room as a link where the browser held the window back', async () => {
      browserOpens(null)
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()

      await start()

      const link = inDialog('open')
      expect(dialog().exists()).toBe(true)
      expect(link.text()).toBe('chatThread.videoOpen')
      expect(link.attributes('href')).toBe(ROOM_WITH_DEFAULT)
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      expect(inDialog('start').exists()).toBe(false)
      expect(inDialog('close').text()).toBe('form.close')
    })

    // The member shut the empty window while the invitation was on its way: it has nothing to
    // be sent to any more, and the dialog offers the room as it does for a blocked window.
    it('offers the room as a link where the empty window was shut meanwhile', async () => {
      browserOpens()
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      const delivery = held()
      threadDelivers.mockReturnValue(delivery.promise)
      await asked()
      await inDialog('start').trigger('click')
      await flushPromises()

      room.closed = true
      delivery.release(true)
      await flushPromises()

      expect(room.location.href).toBe('')
      expect(inDialog('open').attributes('href')).toBe(ROOM_WITH_DEFAULT)
      expect(dialog().exists()).toBe(true)
    })

    it('forgets the link once the dialog is closed', async () => {
      browserOpens(null)
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()
      await start()

      await inDialog('close').trigger('click')
      await camera().trigger('click')

      expect(inDialog('open').exists()).toBe(false)
      expect(inDialog('start').exists()).toBe(true)
    })

    // Nothing of it twice: while a call is being made the button waits, as the compose bar's
    // send button does -- aria-disabled, so a keyboard keeps its place, and a press turned away.
    it('waits while a call is being made, and takes no second press', async () => {
      browserOpens()
      const offer = held()
      serverRooms.mockReturnValue(offer.promise)
      threadDelivers.mockResolvedValue(true)
      await asked()

      await inDialog('start').trigger('click')
      expect(inDialog('start').attributes('aria-disabled')).toBe('true')
      await inDialog('start').trigger('click')

      offer.release({ data: { chatVideoRoom: ROOM } })
      await flushPromises()

      expect(opens).toHaveBeenCalledTimes(1)
      expect(serverRooms).toHaveBeenCalledTimes(1)
      expect(threadDelivers).toHaveBeenCalledTimes(1)
    })

    it('does not wait before it is pressed, nor after it did not come about', async () => {
      browserOpens()
      serverRooms.mockRejectedValue(new Error('CHAT_VIDEO_NO_SERVER'))
      await asked()
      expect(inDialog('start').attributes('aria-disabled')).toBe('false')

      await start()

      expect(inDialog('start').attributes('aria-disabled')).toBe('false')
    })

    // Let go while the room is on its way: the empty window closes, and nothing is sent.
    it('closes the empty window and sends nothing where the question is let go meanwhile', async () => {
      browserOpens()
      const offer = held()
      serverRooms.mockReturnValue(offer.promise)
      await asked()

      await inDialog('start').trigger('click')
      await inDialog('cancel').trigger('click')
      expect(room.close).toHaveBeenCalledTimes(1)

      offer.release({ data: { chatVideoRoom: ROOM } })
      await flushPromises()

      expect(threadDelivers).not.toHaveBeenCalled()
      expect(room.location.href).toBe('')
      expect(dialog().exists()).toBe(false)
    })

    // Let go on the way and asked again: the new question does not wait for the old call, and
    // the old call's late answer changes nothing.
    it('can be started anew after the question was let go on the way', async () => {
      browserOpens()
      const first = held()
      serverRooms.mockReturnValueOnce(first.promise)
      serverRooms.mockResolvedValueOnce({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()
      await inDialog('start').trigger('click')
      await inDialog('cancel').trigger('click')

      await camera().trigger('click')
      expect(inDialog('start').attributes('aria-disabled')).toBe('false')
      await start()

      expect(opens).toHaveBeenCalledTimes(2)
      expect(threadDelivers).toHaveBeenCalledTimes(1)
      expect(room.location.href).toBe(ROOM_WITH_DEFAULT)

      first.release({ data: { chatVideoRoom: { ...ROOM, url: 'https://meet.ffmuc.net/late' } } })
      await flushPromises()
      expect(threadDelivers).toHaveBeenCalledTimes(1)
      expect(room.location.href).toBe(ROOM_WITH_DEFAULT)
    })

    // Another person is another conversation: a question about a call with the one before would
    // now read the new one's name.
    it('lets the question go when the window comes to another person', async () => {
      await asked()
      expect(dialog().exists()).toBe(true)

      await wrapper.setProps({ contact: STRANGER })

      expect(dialog().exists()).toBe(false)
    })

    /**
     * ⛔ The address is the call's secret: whoever has it can join. It goes into the message and
     * into the room's window -- into no log and nothing written to the browser's storage (the
     * vuex store is written whole into localStorage). The store this window reads is a stand-in
     * without `commit` or `dispatch`: a write would throw.
     */
    it('writes the address into no log and no storage, nor the topic that goes with it', async () => {
      const logs = ['log', 'info', 'warn', 'error', 'debug'].map((level) =>
        vi.spyOn(console, level),
      )
      const stores = [vi.spyOn(Storage.prototype, 'setItem')]
      browserOpens(null)
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()
      await topicField().setValue('Lesekreis Momo')

      await start()

      expect(inDialog('open').attributes('href')).toBe(
        withChatVideoTopic(ROOM.url, 'Lesekreis Momo'),
      )
      const written = [...logs, ...stores].flatMap((spy) => spy.mock.calls.flat().map(String))
      expect(written.filter((line) => /k7m2x9q4t8wz|Momo/.test(line))).toEqual([])
    })

    /**
     * V4b: on a computer a box under "Start call" -- "Start in the Jitsi app" (Bernd, 26.09.2026):
     * ticked, the same call, and once the invitation went out the room is handed to the app. The
     * box keeps what it was left at, for the member on this device (chatVideoApp). Whether this
     * is a computer is the browser's to say: a stand-in for `matchMedia` that answers the one
     * question asked. jsdom has none -- the phone's answer, the state every test above runs in.
     */
    /**
     * V5 (Bernd, 27.09.2026): a gear at the left of the two buttons -- the server, and the room's
     * link for people outside the thread. "Zurück · Planen": the server chosen counts at once and
     * stays, per member on this device, as the box "Start in the Jitsi app" does.
     */
    describe('the gear', () => {
      const gear = () => inDialog('gear')
      const serverField = () => inDialog('server')
      const options = () => serverField().findAll('option')
      /** Where this device keeps the member's server: the store's member, `me-id`. */
      const KEY = 'chat-video-server:me-id'
      /** The servers the server names to choose from (chatVideoServerChoices), in its order. */
      const CHOICES = [
        { id: 1, host: 'meet.ffmuc.net', operator: 'Freifunk München (Freie Netze München e. V.)' },
        { id: 2, host: 'meet.systemli.org', operator: 'Systemli' },
        { id: 7, host: 'meet.example.org', operator: null },
      ]
      const SYSTEMLI = {
        url: 'https://meet.systemli.org/q2w3e4r5t6y7',
        host: 'meet.systemli.org',
        operator: 'Systemli',
      }
      const FFMUC = {
        url: 'https://meet.ffmuc.net/z9x8c7v6b5n4',
        host: 'meet.ffmuc.net',
        operator: CHOICES[0].operator,
      }

      /** The clipboard as the browser offers it; a test decides whether it refuses. */
      let clipboard
      beforeEach(() => {
        serverChoices.mockResolvedValue({ data: { chatVideoServerChoices: CHOICES } })
        clipboard = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: clipboard },
          configurable: true,
        })
      })

      afterEach(() => {
        delete navigator.clipboard
        localStorage.clear()
      })

      /** The question open, the list of servers in. */
      const askedWithChoices = async (options = {}) => {
        await asked(options)
        await flushPromises()
      }

      /** The gear's view open, and what it asked for in. */
      const inSettings = async () => {
        await gear().trigger('click')
        await flushPromises()
      }

      it('stands at the left of the two buttons: a button a keyboard reaches, named by what it opens', async () => {
        await askedWithChoices()

        const footer = [...dialog().element.querySelectorAll('button')].map((button) =>
          button.getAttribute('data-test'),
        )
        expect(footer.slice(0, 3)).toEqual([
          'chat-video-gear',
          'chat-video-cancel',
          'chat-video-start',
        ])
        expect(gear().attributes('type')).toBe('button')
        expect(gear().attributes('tabindex')).toBeUndefined()
        expect(gear().attributes('aria-label')).toBe('chatThread.videoSettings')
        expect(gear().attributes('title')).toBe('chatThread.videoSettings')
        expect(gear().attributes('aria-disabled')).toBe('false')
      })

      // Phones as well: the server and the link are no computer's business alone (the box is).
      it('stands on a phone as well', async () => {
        vi.stubGlobal('matchMedia', () => ({ matches: false }))
        await askedWithChoices()

        expect(gear().exists()).toBe(true)
        expect(wrapper.find('[data-test="chat-video-app-box"]').exists()).toBe(false)
        vi.unstubAllGlobals()
      })

      // A check every ten minutes may take a server out or bring it back.
      it('asks for the servers to choose from with every question, past the cache', async () => {
        await askedWithChoices()
        await inDialog('cancel').trigger('click')
        await camera().trigger('click')

        expect(serverChoices).toHaveBeenCalledTimes(2)
        expect(serverChoices).toHaveBeenCalledWith({
          query: chatVideoServerChoices,
          fetchPolicy: 'network-only',
        })
      })

      it('shows its view in the question\'s place: the title, the topic, the servers, and only "Back"', async () => {
        await askedWithChoices()
        await topicField().setValue('Lesekreis')

        await inSettings()

        expect(inDialog('settings-title').text()).toBe(
          'chatThread.videoSettingsTitle {"name":"Carla-Sonne"}',
        )
        expect(inDialog('settings-topic').text()).toBe(
          'chatThread.videoTopicLine {"topic":"Lesekreis"}',
        )
        expect(options().map((option) => option.text())).toEqual([
          'chatThread.videoServerRandom',
          'meet.ffmuc.net – Freifunk München (Freie Netze München e. V.)',
          'meet.systemli.org – Systemli',
          'meet.example.org',
        ])
        expect(wrapper.find(`label[for="${serverField().attributes('id')}"]`).text()).toBe(
          'chatThread.videoServer',
        )
        expect(inDialog('title').exists()).toBe(false)
        expect(topicField().exists()).toBe(false)
        expect(inDialog('start').exists()).toBe(false)
        expect(inDialog('cancel').exists()).toBe(false)
        expect(gear().exists()).toBe(false)
        expect(inDialog('back').text()).toBe('back')
      })

      it('names the default topic where the field was emptied', async () => {
        await askedWithChoices()
        await topicField().setValue('   ')

        await inSettings()

        expect(inDialog('settings-topic').text()).toBe(
          'chatThread.videoTopicLine {"topic":"Videoanruf"}',
        )
      })

      it('returns to the question on "Back", the topic as it was', async () => {
        await askedWithChoices()
        await topicField().setValue('Lesekreis')
        await inSettings()

        await inDialog('back').trigger('click')

        expect(inDialog('title').exists()).toBe(true)
        expect(topicField().element.value).toBe('Lesekreis')
        expect(inDialog('settings-title').exists()).toBe(false)
      })

      it('focuses the field as its view opens, and the gear again on "Back"', async () => {
        const focused = vi.spyOn(HTMLElement.prototype, 'focus')
        await askedWithChoices()

        await inSettings()
        expect(focused.mock.contexts.at(-1)).toBe(serverField().element)

        await inDialog('back').trigger('click')
        await flushPromises()
        expect(focused.mock.contexts.at(-1)).toBe(gear().element)
      })

      it('offers "at random" first, chosen where nothing is remembered', async () => {
        await askedWithChoices()
        await inSettings()

        expect(options()[0].element.selected).toBe(true)
      })

      it('remembers the server chosen at once, for this member on this device; "at random" forgets it', async () => {
        localStorage.setItem('chat-video-server:other-id', '1')
        await askedWithChoices()
        await inSettings()

        await options()[2].setSelected()
        expect(localStorage.getItem(KEY)).toBe('2')

        await options()[0].setSelected()
        expect(localStorage.getItem(KEY)).toBeNull()
        expect(localStorage.getItem('chat-video-server:other-id')).toBe('1')
      })

      it('names the server remembered in the question, and starts the call on it', async () => {
        localStorage.setItem(KEY, '2')
        browserOpens()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await askedWithChoices()

        expect(inDialog('server-chosen').text()).toBe(
          'chatThread.videoServerChosen {"host":"meet.systemli.org"}',
        )
        await start()

        expect(serverRooms).toHaveBeenCalledTimes(1)
        expect(serverRooms).toHaveBeenCalledWith({
          query: chatVideoRoom,
          variables: { serverId: 2 },
          fetchPolicy: 'no-cache',
        })
        const address = withChatVideoTopic(SYSTEMLI.url, 'Videoanruf')
        expect(threadDelivers.mock.calls[0][0].body).toBe(
          `chatThread.videoInvite ${JSON.stringify({ operator: 'Systemli', url: address })}`,
        )
        expect(room.location.href).toBe(address)
      })

      it('shows the server remembered as chosen in its view', async () => {
        localStorage.setItem(KEY, '7')
        await askedWithChoices()
        await inSettings()

        expect(options()[3].element.selected).toBe(true)
      })

      // A server switched off or not answering since: the call goes at random, as before, and the
      // choice stays for when it is back.
      it('goes at random where the server remembered is not to be had, and keeps it remembered', async () => {
        localStorage.setItem(KEY, '5')
        browserOpens()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
        threadDelivers.mockResolvedValue(true)
        await askedWithChoices()

        expect(inDialog('server-chosen').exists()).toBe(false)
        await start()

        expect(serverRooms).toHaveBeenCalledWith({ query: chatVideoRoom, fetchPolicy: 'no-cache' })
        expect(serverRooms.mock.calls[0][0]).not.toHaveProperty('variables')
        expect(localStorage.getItem(KEY)).toBe('5')
      })

      it('goes at random where the list could not be had', async () => {
        localStorage.setItem(KEY, '2')
        serverChoices.mockRejectedValue(new Error('Network error'))
        browserOpens()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
        threadDelivers.mockResolvedValue(true)
        await askedWithChoices()

        await start()

        expect(serverRooms.mock.calls[0][0]).not.toHaveProperty('variables')
        expect(room.location.href).toBe(ROOM_WITH_DEFAULT)
      })

      // A press before the list is in still goes to the server remembered.
      it('waits for the list before a quick press decides the server', async () => {
        localStorage.setItem(KEY, '2')
        const list = held()
        serverChoices.mockReturnValue(list.promise)
        browserOpens()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await asked()

        inDialog('start').element.click()
        await flushPromises()
        expect(serverRooms).not.toHaveBeenCalled()

        list.release({ data: { chatVideoServerChoices: CHOICES } })
        await flushPromises()
        expect(serverRooms.mock.calls[0][0].variables).toEqual({ serverId: 2 })
      })

      /**
       * ⛔ The room is asked for as the view opens, so that the clipboard is written in the click
       * itself: Safari does not count a write after a round trip as one in answer to a tap. The
       * press is dispatched by hand and nothing is awaited before the clipboard is looked at.
       */
      it('asks for the room as its view opens, and copies the whole link in the click', async () => {
        localStorage.setItem(KEY, '2')
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        await askedWithChoices()
        await topicField().setValue('Lesekreis')

        await inSettings()
        expect(serverRooms).toHaveBeenCalledTimes(1)
        expect(serverRooms.mock.calls[0][0].variables).toEqual({ serverId: 2 })

        inDialog('copy').element.click()
        const link = withChatVideoTopic(SYSTEMLI.url, 'Lesekreis')
        expect(clipboard).toHaveBeenCalledWith(link)

        await flushPromises()
        expect(inDialog('copy').text()).toBe('chatThread.videoLinkCopied')
        expect(inDialog('link').text()).toBe(link)
        expect(serverRooms).toHaveBeenCalledTimes(1)
      })

      it('awaits the room where it is not in yet, and copies it then', async () => {
        const offer = held()
        serverRooms.mockReturnValue(offer.promise)
        await askedWithChoices()
        await inSettings()

        inDialog('copy').element.click()
        expect(clipboard).not.toHaveBeenCalled()

        offer.release({ data: { chatVideoRoom: ROOM } })
        await flushPromises()
        expect(clipboard).toHaveBeenCalledWith(ROOM_WITH_DEFAULT)
        expect(serverRooms).toHaveBeenCalledTimes(1)
      })

      // coderabbit, #4015: a press before the list is in waits for it -- else the link would name a
      // room at random, and the call started afterwards another one.
      it('waits for the list before it copies a link, so link and call share the room', async () => {
        localStorage.setItem(KEY, '2')
        const list = held()
        serverChoices.mockReturnValue(list.promise)
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        await asked()
        await inSettings()

        inDialog('copy').element.click()
        await flushPromises()
        expect(serverRooms).not.toHaveBeenCalled()
        expect(clipboard).not.toHaveBeenCalled()

        list.release({ data: { chatVideoServerChoices: CHOICES } })
        await flushPromises()
        expect(serverRooms).toHaveBeenCalledTimes(1)
        expect(serverRooms.mock.calls[0][0].variables).toEqual({ serverId: 2 })
        expect(clipboard).toHaveBeenCalledWith(withChatVideoTopic(SYSTEMLI.url, 'Videoanruf'))
      })

      // The people the link went to and the person invited meet in the same room.
      it('sends the room it copied, when the call is started from this question', async () => {
        localStorage.setItem(KEY, '2')
        browserOpens()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await askedWithChoices()
        await inSettings()
        await inDialog('copy').trigger('click')
        await flushPromises()
        await inDialog('back').trigger('click')

        await start()

        expect(serverRooms).toHaveBeenCalledTimes(1)
        expect(room.location.href).toBe(withChatVideoTopic(SYSTEMLI.url, 'Videoanruf'))
      })

      it('shows the link where the browser refuses the clipboard, and does not say it was copied', async () => {
        clipboard.mockRejectedValue(new Error('NotAllowedError'))
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
        await askedWithChoices()
        await inSettings()

        await inDialog('copy').trigger('click')
        await flushPromises()

        expect(inDialog('link').text()).toBe(ROOM_WITH_DEFAULT)
        expect(inDialog('copy').text()).toBe('chatThread.videoCopyLink')
      })

      it('shows the link where there is no clipboard at all', async () => {
        delete navigator.clipboard
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
        await askedWithChoices()
        await inSettings()

        await inDialog('copy').trigger('click')
        await flushPromises()

        expect(inDialog('link').text()).toBe(ROOM_WITH_DEFAULT)
        expect(inDialog('copy').text()).toBe('chatThread.videoCopyLink')
      })

      // Another server is another room: the link copied for the last one is not this one's.
      it('lets the link go when another server is chosen, and asks for a room on that one', async () => {
        localStorage.setItem(KEY, '2')
        browserOpens()
        serverRooms
          .mockResolvedValueOnce({ data: { chatVideoRoom: SYSTEMLI } })
          .mockResolvedValueOnce({ data: { chatVideoRoom: FFMUC } })
        threadDelivers.mockResolvedValue(true)
        await askedWithChoices()
        await inSettings()
        await inDialog('copy').trigger('click')
        await flushPromises()

        await options()[1].setSelected()
        await flushPromises()

        expect(inDialog('link').exists()).toBe(false)
        expect(inDialog('copy').text()).toBe('chatThread.videoCopyLink')
        expect(serverRooms.mock.calls[1][0].variables).toEqual({ serverId: 1 })
        await inDialog('back').trigger('click')
        await start()
        expect(serverRooms).toHaveBeenCalledTimes(2)
        expect(room.location.href).toBe(withChatVideoTopic(FFMUC.url, 'Videoanruf'))
      })

      // A copy still waiting for the last server's room would put that room on the clipboard while
      // the new server is shown -- and the call would go to another room (coderabbit, #3994).
      it('lets a copy on its way go when another server is chosen', async () => {
        localStorage.setItem(KEY, '2')
        const late = held()
        serverRooms
          .mockReturnValueOnce(late.promise)
          .mockResolvedValueOnce({ data: { chatVideoRoom: FFMUC } })
        await askedWithChoices()
        await inSettings()
        inDialog('copy').element.click()

        await options()[1].setSelected()
        late.release({ data: { chatVideoRoom: SYSTEMLI } })
        await flushPromises()

        expect(clipboard).not.toHaveBeenCalled()
        expect(inDialog('link').exists()).toBe(false)
        expect(inDialog('copy').text()).toBe('chatThread.videoCopyLink')

        await inDialog('copy').trigger('click')
        await flushPromises()
        expect(clipboard).toHaveBeenCalledWith(withChatVideoTopic(FFMUC.url, 'Videoanruf'))
      })

      it('says so where the chosen server is no longer to be had, at the start', async () => {
        localStorage.setItem(KEY, '2')
        browserOpens()
        serverRooms.mockRejectedValue(new Error('CHAT_VIDEO_SERVER_UNAVAILABLE'))
        await askedWithChoices()

        await start()

        expect(inDialog('problem').text()).toBe('chatThread.videoServerGone')
        expect(room.close).toHaveBeenCalledTimes(1)
        expect(threadDelivers).not.toHaveBeenCalled()
      })

      it('says so in its view where the chosen server is no longer to be had, and copies nothing', async () => {
        localStorage.setItem(KEY, '2')
        serverRooms.mockRejectedValue(new Error('CHAT_VIDEO_SERVER_UNAVAILABLE'))
        await askedWithChoices()
        await inSettings()

        await inDialog('copy').trigger('click')
        await flushPromises()

        expect(inDialog('settings-problem').text()).toBe('chatThread.videoServerGone')
        expect(clipboard).not.toHaveBeenCalled()
        expect(inDialog('link').exists()).toBe(false)
        // Asked anew at the press: a failed asking is not kept.
        expect(serverRooms).toHaveBeenCalledTimes(2)
      })

      it('says there is no server where none answers, at "Copy link"', async () => {
        serverRooms.mockRejectedValue(new Error('CHAT_VIDEO_NO_SERVER'))
        await askedWithChoices()
        await inSettings()

        await inDialog('copy').trigger('click')
        await flushPromises()

        expect(inDialog('settings-problem').text()).toBe('chatThread.videoNoServer')
      })

      it('lets the sentence go on "Back"', async () => {
        serverRooms.mockRejectedValue(new Error('CHAT_VIDEO_NO_SERVER'))
        await askedWithChoices()
        await inSettings()
        await inDialog('copy').trigger('click')
        await flushPromises()

        await inDialog('back').trigger('click')

        expect(inDialog('problem').exists()).toBe(false)
      })

      it('waits while a call is being made, as the start button does', async () => {
        browserOpens()
        serverRooms.mockReturnValue(held().promise)
        await askedWithChoices()
        await inDialog('start').trigger('click')

        expect(gear().attributes('aria-disabled')).toBe('true')
        await gear().trigger('click')
        expect(inDialog('settings-title').exists()).toBe(false)
      })

      it('lets the room go with the question: the next question asks for another', async () => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
        await askedWithChoices()
        await inSettings()
        await inDialog('back').trigger('click')
        await inDialog('cancel').trigger('click')

        await camera().trigger('click')
        await flushPromises()
        await inSettings()

        expect(serverRooms).toHaveBeenCalledTimes(2)
        expect(inDialog('link').exists()).toBe(false)
      })

      // Closed while its view is open -- Escape, or a tap beside the dialog: the next question
      // opens on the question.
      it('opens on the question, not on its view, the next time', async () => {
        const question = () =>
          wrapper
            .findAllComponents({ name: 'BModal' })
            .find((modal) => modal.attributes('data-test') === 'chat-video-dialog')
        await askedWithChoices()
        await inSettings()

        question().vm.$emit('update:modelValue', false)
        await flushPromises()
        await camera().trigger('click')

        expect(inDialog('title').exists()).toBe(true)
        expect(inDialog('settings-title').exists()).toBe(false)
      })

      // ⛔ The address is the call's secret: only the server's id is kept on the device.
      it('keeps the room out of every store: only the server chosen stays', async () => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        await askedWithChoices()
        await inSettings()
        await options()[2].setSelected()
        await flushPromises()
        await inDialog('copy').trigger('click')
        await flushPromises()

        expect({ ...localStorage }).toEqual({ [KEY]: '2' })
        expect(JSON.stringify({ ...sessionStorage })).not.toContain('q2w3e4r5t6y7')
      })
    })

    /**
     * V5b (Bernd, 27.09.2026): "aus einem Pickup-Kalender ein Datum und eine Uhrzeit von bis" in
     * the gear's view, "Bei Planen werden dann die Sitzungsdaten in die Chat-Bubble eingetragen",
     * and the calendar file of the same call. The tests run in UTC (TZ=UTC): the fields' own time
     * is UTC here.
     */
    describe('planning a call', () => {
      const KEY = 'chat-video-server:me-id'
      const CHOICES = [
        { id: 1, host: 'meet.ffmuc.net', operator: 'Freifunk München (Freie Netze München e. V.)' },
        { id: 2, host: 'meet.systemli.org', operator: 'Systemli' },
      ]
      const SYSTEMLI = {
        url: 'https://meet.systemli.org/q2w3e4r5t6y7',
        host: 'meet.systemli.org',
        operator: 'Systemli',
      }
      const START = new Date('2026-09-30T15:00:00.000Z')
      const END = new Date('2026-09-30T16:00:00.000Z')
      /** The time of the call as the plan's words carry it: the day, and the key with the times. */
      const TIME = `chatThread.videoPlannedTime ${JSON.stringify({
        from: `time(${START.toISOString()})`,
        to: `time(${END.toISOString()})`,
        zone: 'UTC',
      })}`
      const DAY = 'Mittwoch, 30. September 2026'
      const field = (name) => inDialog(name)
      const gear = () => inDialog('gear')

      let clipboard
      beforeEach(() => {
        serverChoices.mockResolvedValue({ data: { chatVideoServerChoices: CHOICES } })
        clipboard = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: clipboard },
          configurable: true,
        })
        localStorage.setItem(KEY, '2')
      })

      afterEach(() => {
        delete navigator.clipboard
        localStorage.clear()
      })

      /** The gear's view open, the list of servers in. */
      const inSettings = async ({ exists = true } = {}) => {
        await asked({ exists })
        await flushPromises()
        await gear().trigger('click')
        await flushPromises()
      }

      /** The fields filled as a member fills them: the day, the start (the end follows), the end. */
      const when = async ({ day = '2026-09-30', from = '15:00', to } = {}) => {
        await field('day').setValue(day)
        await field('from').setValue(from)
        await field('from').trigger('change')
        if (to !== undefined) await field('to').setValue(to)
      }

      const plan = async () => {
        await field('plan').trigger('click')
        await flushPromises()
      }

      /**
       * E-058 (Bernd, 30.09.2026): "Duplizieren" under an invitation in the thread -- the question
       * with its topic and its ROOM, the same link; a planned one on the gear's view, the same
       * weekday and time a week on. Another server chosen there is another room.
       */
      describe('a duplicated invitation', () => {
        const duplicated = async (invitation) => {
          mountWindow()
          await threadSays({ exists: true, mutedByMe: false })
          await wrapper.findComponent({ name: 'ChatThread' }).vm.$emit('duplicateVideo', invitation)
          await flushPromises()
        }

        beforeEach(() => {
          vi.useFakeTimers({ toFake: ['Date'] })
          vi.setSystemTime(new Date('2026-09-30T12:00:00.000Z'))
        })
        afterEach(() => {
          vi.useRealTimers()
        })

        it("opens a planned one on the gear, its room's server chosen, a week on", async () => {
          threadDelivers.mockResolvedValue(true)
          await duplicated({ room: SYSTEMLI.url, topic: 'Lesekreis', start: START, end: END })

          expect(dialog().exists()).toBe(true)
          expect(field('day').element.value).toBe('2026-10-07')
          expect(field('from').element.value).toBe('15:00')
          expect(field('to').element.value).toBe('16:00')
          expect(field('server').element.value).toBe('2')

          await plan()
          expect(serverRooms).not.toHaveBeenCalled()
          const next = {
            start: new Date('2026-10-07T15:00:00.000Z'),
            end: new Date('2026-10-07T16:00:00.000Z'),
          }
          expect(threadDelivers.mock.calls[0][0].body).toContain(
            withChatVideoTopic(SYSTEMLI.url, 'Lesekreis', next),
          )
          expect(threadDelivers.mock.calls[0][0].body).toContain('Systemli')
        })

        it('opens a call now on the question with its topic, and starts it in the same room', async () => {
          browserOpens()
          threadDelivers.mockResolvedValue(true)
          await duplicated({ room: ROOM.url, topic: 'Stammtisch', start: null, end: null })

          expect(topicField().element.value).toBe('Stammtisch')
          expect(field('day').exists()).toBe(false)
          await start()
          expect(serverRooms).not.toHaveBeenCalled()
          const address = withChatVideoTopic(ROOM.url, 'Stammtisch')
          expect(threadDelivers.mock.calls[0][0].body).toContain(address)
          expect(room.location.href).toBe(address)
        })

        it('asks for another room where another server is chosen', async () => {
          serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
          await duplicated({ room: SYSTEMLI.url, topic: 'Lesekreis', start: START, end: END })
          expect(serverRooms).not.toHaveBeenCalled()
          await field('server').setValue('1')
          await flushPromises()
          expect(serverRooms).toHaveBeenCalledTimes(1)
        })

        // The room's server is not in the list (taken out since): the room stays, no server is
        // chosen, and the invitation names the host.
        it('keeps a room on a server the list does not have, and names its host', async () => {
          browserOpens()
          threadDelivers.mockResolvedValue(true)
          const elsewhere = 'https://meet.example.org/abc123def456'
          await duplicated({ room: elsewhere, topic: 'Stammtisch', start: null, end: null })
          await start()
          expect(serverRooms).not.toHaveBeenCalled()
          expect(threadDelivers.mock.calls[0][0].body).toContain('"operator":"meet.example.org"')
          expect(threadDelivers.mock.calls[0][0].body).toContain(
            withChatVideoTopic(elsewhere, 'Stammtisch'),
          )
        })

        it("leaves the member's own choice of server as it was", async () => {
          await duplicated({ room: ROOM.url, topic: 'Stammtisch', start: null, end: null })
          expect(localStorage.getItem(KEY)).toBe('2')
        })
      })

      it('offers a day, a start and an end under the server, each named, empty', async () => {
        await inSettings()

        for (const [name, type, label] of [
          ['day', 'date', 'chatThread.videoDate'],
          ['from', 'time', 'chatThread.videoFrom'],
          ['to', 'time', 'chatThread.videoTo'],
        ]) {
          const input = field(name)
          expect(input.attributes('type'), name).toBe(type)
          expect(input.element.value, name).toBe('')
          expect(wrapper.find(`label[for="${input.attributes('id')}"]`).text()).toBe(label)
        }
        expect(field('from').attributes('step')).toBe('300')
        expect(field('day').attributes('min')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        const group = field('day').element.closest('[role="group"]')
        expect(
          group.querySelector(`#${group.getAttribute('aria-labelledby')}`).textContent.trim(),
        ).toBe('chatThread.videoWhen')
      })

      it('names the time zone the fields mean', async () => {
        await inSettings()

        expect(field('when-hint').text()).toBe('chatThread.videoWhenHint {"zone":"UTC"}')
      })

      it('empties the day and the times again for the next question', async () => {
        await inSettings()
        await when({ to: '17:00' })
        await field('back').trigger('click')
        await inDialog('cancel').trigger('click')

        await camera().trigger('click')
        await flushPromises()
        await gear().trigger('click')

        expect(field('day').element.value).toBe('')
        expect(field('from').element.value).toBe('')
        expect(field('to').element.value).toBe('')
      })

      it('puts the end an hour after the start, and keeps an end chosen by hand', async () => {
        await inSettings()

        await when({ from: '15:00' })
        expect(field('to').element.value).toBe('16:00')

        await field('to').setValue('17:30')
        await field('from').setValue('16:00')
        await field('from').trigger('change')
        expect(field('to').element.value).toBe('17:30')

        await field('from').setValue('18:00')
        await field('from').trigger('change')
        expect(field('to').element.value).toBe('19:00')

        await field('from').setValue('23:30')
        await field('from').trigger('change')
        expect(field('to').element.value).toBe('23:59')
      })

      it.each([
        ['no day', { day: '' }],
        ['the end before the start', { to: '14:00' }],
      ])('says what is missing where %s, and sends nothing', async (_, fields) => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await inSettings()
        await when(fields)
        serverRooms.mockClear()

        await plan()

        expect(field('settings-problem').text()).toBe('chatThread.videoPlanIncomplete')
        expect(serverRooms).not.toHaveBeenCalled()
        expect(threadDelivers).not.toHaveBeenCalled()
        expect(dialog().exists()).toBe(true)
      })

      it('sends the invitation with the day and the time, on the server chosen, opens no room, and closes', async () => {
        browserOpens()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await inSettings()
        await when()

        await plan()

        const url = withChatVideoTopic(SYSTEMLI.url, 'Videoanruf', { start: START, end: END })
        expect(url).toContain('&gradido.start=1790780400&gradido.end=1790784000')
        expect(threadDelivers).toHaveBeenCalledTimes(1)
        expect(threadDelivers).toHaveBeenCalledWith(
          {
            body: `chatThread.videoInvitePlanned ${JSON.stringify({ date: DAY, time: TIME, operator: 'Systemli', url })}`,
            notify: 'NONE',
          },
          'carla-id',
        )
        expect(serverRooms).toHaveBeenCalledWith({
          query: chatVideoRoom,
          variables: { serverId: 2 },
          fetchPolicy: 'no-cache',
        })
        expect(opens).not.toHaveBeenCalled()
        expect(dialog().exists()).toBe(false)
      })

      it('names a topic of its own on a line of its own', async () => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await asked()
        await flushPromises()
        await topicField().setValue('Lesekreis')
        await gear().trigger('click')
        await flushPromises()
        await when()

        await plan()

        const url = withChatVideoTopic(SYSTEMLI.url, 'Lesekreis', { start: START, end: END })
        expect(threadDelivers.mock.calls[0][0].body).toBe(
          `chatThread.videoInvitePlannedTopic ${JSON.stringify({ topic: 'Lesekreis', date: DAY, time: TIME, operator: 'Systemli', url })}`,
        )
      })

      // The people the link went to and the person invited meet in one room.
      it('sends the room a copied link already went out for', async () => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await inSettings()
        await field('copy').trigger('click')
        await flushPromises()
        await when()

        await plan()

        expect(serverRooms).toHaveBeenCalledTimes(1)
        expect(threadDelivers.mock.calls[0][0].body).toContain(SYSTEMLI.url)
      })

      it('offers the question’s box, and sends by mail as well where it is ticked', async () => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await asked()
        await flushPromises()
        await inDialog('email').setValue(true)
        await gear().trigger('click')
        await flushPromises()

        expect(field('plan-body').text()).toBe('chatThread.videoPlanBody {"name":"Carla-Sonne"}')
        expect(field('plan-email').element.checked).toBe(true)
        await when()
        await plan()

        expect(threadDelivers.mock.calls[0][0].notify).toBe('EMAIL')
      })

      // E-024: the first message of a pair goes by mail in any case -- nothing to choose.
      it('says the first message goes by mail as well, and offers no box for it', async () => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(true)
        await inSettings({ exists: false })

        expect(field('plan-body').text()).toBe('chatThread.videoPlanFirst {"name":"Carla-Sonne"}')
        expect(field('plan-email').exists()).toBe(false)
        await when()
        await plan()
        expect(threadDelivers.mock.calls[0][0].notify).toBe('EMAIL')
      })

      it('waits while the invitation is on its way: a second press, the server, the link and the file wait too', async () => {
        const saved = vi.fn()
        URL.createObjectURL = saved
        const delivery = held()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockReturnValue(delivery.promise)
        await inSettings()
        await when()

        await plan()
        expect(field('plan').attributes('aria-disabled')).toBe('true')
        expect(field('server').element.disabled).toBe(true)
        await plan()
        await field('copy').trigger('click')
        await field('calendar').trigger('click')
        await flushPromises()

        expect(threadDelivers).toHaveBeenCalledTimes(1)
        expect(clipboard).not.toHaveBeenCalled()
        expect(saved).not.toHaveBeenCalled()
        delivery.release(true)
        await flushPromises()
        expect(dialog().exists()).toBe(false)
        delete URL.createObjectURL
      })

      // The member's own presses just before "Plan" are not let go by it: the same room either way.
      it('lets a copy pressed just before it finish, in the same room', async () => {
        const room = held()
        serverRooms.mockReturnValue(room.promise)
        threadDelivers.mockResolvedValue(true)
        await inSettings()
        await when()

        await field('copy').trigger('click')
        await plan()
        room.release({ data: { chatVideoRoom: SYSTEMLI } })
        await flushPromises()

        expect(serverRooms).toHaveBeenCalledTimes(1)
        expect(clipboard).toHaveBeenCalledWith(withChatVideoTopic(SYSTEMLI.url, 'Videoanruf'))
        expect(threadDelivers.mock.calls[0][0].body).toContain(SYSTEMLI.url)
        expect(dialog().exists()).toBe(false)
      })

      it('names the server’s address where it has no operator', async () => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: { ...SYSTEMLI, operator: null } } })
        threadDelivers.mockResolvedValue(true)
        await inSettings()
        await when()

        await plan()

        expect(threadDelivers.mock.calls[0][0].body).toContain('"operator":"meet.systemli.org"')
      })

      it('says so where the invitation did not go out, and stays', async () => {
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
        threadDelivers.mockResolvedValue(false)
        await inSettings()
        await when()

        await plan()

        expect(field('settings-problem').text()).toBe('chatThread.videoNotSent')
        expect(field('plan').attributes('aria-disabled')).toBe('false')
        expect(dialog().exists()).toBe(true)
      })

      it('says so where the chosen server is no longer to be had', async () => {
        serverRooms.mockRejectedValue(new Error('CHAT_VIDEO_SERVER_UNAVAILABLE'))
        threadDelivers.mockResolvedValue(true)
        await inSettings()
        await when()

        await plan()

        expect(field('settings-problem').text()).toBe('chatThread.videoServerGone')
        expect(threadDelivers).not.toHaveBeenCalled()
      })

      describe('the calendar file', () => {
        let blobs
        let saved
        beforeEach(() => {
          blobs = []
          URL.createObjectURL = (blob) => {
            blobs.push(blob)
            return 'blob:calendar'
          }
          URL.revokeObjectURL = vi.fn()
          saved = []
          vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
            saved.push(this.download)
          })
        })

        afterEach(() => {
          delete URL.createObjectURL
          delete URL.revokeObjectURL
        })

        const text = (blob) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.readAsText(blob)
          })

        it('saves the planned call: its time, its title, the invitation as its note, the room -- and sends nothing', async () => {
          serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
          await inSettings()
          await when()

          await field('calendar').trigger('click')
          await flushPromises()

          expect(saved).toEqual(['Videoanruf-2026-09-30.ics'])
          const file = (await text(blobs[0])).replace(/\r\n /g, '')
          const url = withChatVideoTopic(SYSTEMLI.url, 'Videoanruf', { start: START, end: END })
          expect(file).toContain('DTSTART:20260930T150000Z\r\n')
          expect(file).toContain('DTEND:20260930T160000Z\r\n')
          expect(file).toContain('SUMMARY:Videoanruf – Carla-Sonne\r\n')
          expect(file).toContain(`URL:${url}\r\n`)
          expect(file).toContain('UID:q2w3e4r5t6y7-1790780400@gradido\r\n')
          expect(file).toContain('DESCRIPTION:chatThread.videoInvitePlanned')
          expect(threadDelivers).not.toHaveBeenCalled()
          expect(dialog().exists()).toBe(true)
        })

        // coderabbit, #4015: as "Copy link" -- the file names the room the call will take.
        it('waits for the list before it saves, so the file names the room of the call', async () => {
          const list = held()
          serverChoices.mockReturnValue(list.promise)
          serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
          await inSettings()
          await when()

          await field('calendar').trigger('click')
          await flushPromises()
          expect(serverRooms).not.toHaveBeenCalled()
          expect(saved).toEqual([])

          list.release({ data: { chatVideoServerChoices: CHOICES } })
          await flushPromises()
          expect(serverRooms).toHaveBeenCalledTimes(1)
          expect(serverRooms.mock.calls[0][0].variables).toEqual({ serverId: 2 })
          expect(saved).toEqual(['Videoanruf-2026-09-30.ics'])
        })

        it('says what is missing without a day, and saves nothing', async () => {
          await inSettings()

          await field('calendar').trigger('click')
          await flushPromises()

          expect(field('settings-problem').text()).toBe('chatThread.videoPlanIncomplete')
          expect(saved).toEqual([])
        })
      })

      // The suite's clock is UTC, which knows neither summer nor winter time: on a clock in Berlin
      // the fields mean Berlin's time, and the zone named is the one of the day chosen.
      describe('on a clock in Berlin', () => {
        beforeEach(() => {
          process.env.TZ = 'Europe/Berlin'
        })

        afterEach(() => {
          process.env.TZ = 'UTC'
        })

        it('names the zone of the day chosen: summer time in September, winter time in December', async () => {
          await inSettings()

          await when({ day: '2026-09-30' })
          expect(field('when-hint').text()).toBe('chatThread.videoWhenHint {"zone":"MESZ"}')
          await field('day').setValue('2026-12-02')
          expect(field('when-hint').text()).toBe('chatThread.videoWhenHint {"zone":"MEZ"}')
        })

        it('sends the time the fields show on that clock, its zone named', async () => {
          serverRooms.mockResolvedValue({ data: { chatVideoRoom: SYSTEMLI } })
          threadDelivers.mockResolvedValue(true)
          await inSettings()
          await when()

          await plan()

          const start = new Date('2026-09-30T13:00:00.000Z')
          const end = new Date('2026-09-30T14:00:00.000Z')
          const url = withChatVideoTopic(SYSTEMLI.url, 'Videoanruf', { start, end })
          expect(url).toContain('&gradido.start=1790773200&gradido.end=1790776800')
          const time = `chatThread.videoPlannedTime ${JSON.stringify({
            from: `time(${start.toISOString()})`,
            to: `time(${end.toISOString()})`,
            zone: 'MESZ',
          })}`
          expect(threadDelivers.mock.calls[0][0].body).toBe(
            `chatThread.videoInvitePlanned ${JSON.stringify({ date: DAY, time, operator: 'Systemli', url })}`,
          )
        })
      })

      it('gives the waiting look to "Plan" as well, in the stylesheet', () => {
        // The questions of a call stand in a component of their own since E-053.
        const code = readFileSync(
          join(dirname(fileURLToPath(import.meta.url)), '../Chat/ChatVideoCall.vue'),
          'utf8',
        ).replace(/\/\*[\s\S]*?\*\//g, '')
        expect(code).toMatch(/\.chat-video-plan\[aria-disabled='true'\]/)
        expect(code).toMatch(/\n\.chat-video-when\s*\{[^}]*grid-template-columns/)
        // On a phone the day takes a row of its own, and the two times share the next.
        expect(code).toMatch(
          /@media \(width <= 420px\)\s*\{[^@]*\.chat-video-when-day\s*\{[^}]*grid-column:\s*1 \/ -1/,
        )
      })
    })

    describe('the box "Start in the Jitsi app"', () => {
      const onAComputer = () => {
        vi.stubGlobal('matchMedia', (query) => ({
          matches: query === '(pointer: fine) and (hover: hover)',
        }))
      }
      const box = () => wrapper.find('[data-test="chat-video-app-box"]')
      const buttons = () =>
        dialog()
          .findAll('button')
          .map((b) => b.attributes('data-test'))
      const missed = () => wrapper.find('[data-test="chat-video-app-missed"]')
      /** The same room as the app's address (chatVideoApp), with the default topic. */
      const APP_ROOM = 'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Videoanruf%22'
      /** Where this device keeps the member's tick: the store's member, `me-id`. */
      const KEY = 'chat-video-in-app:me-id'

      /** The links the page followed -- the app's address goes by one (openInJitsiApp). */
      let followed
      beforeEach(() => {
        followed = []
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
          followed.push(this.href)
        })
        // The page has the focus when the member presses: a sign can come.
        vi.spyOn(document, 'hasFocus').mockReturnValue(true)
      })

      afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
        localStorage.clear()
      })

      /** The question on a computer, the box ticked, and a call that will go through. */
      const tickedAndReady = async ({ exists = true } = {}) => {
        browserOpens()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
        threadDelivers.mockResolvedValue(true)
        onAComputer()
        await asked({ exists })
        await box().setValue(true)
      }

      it('stands under "Start call" on a computer, empty, with no third button', async () => {
        onAComputer()
        await asked()

        // The gear at the left is no way of starting (V5).
        expect(buttons()).toEqual(['chat-video-gear', 'chat-video-cancel', 'chat-video-start'])
        expect(box().element.type).toBe('checkbox')
        expect(box().element.checked).toBe(false)
        const label = box().element.closest('label')
        expect(label.textContent.trim()).toBe('chatThread.videoStartInApp')
        expect(label.getAttribute('title')).toBe('chatThread.videoInAppHint')
        // After the start button, on a line of its own at the right.
        expect(
          inDialog('start').element.compareDocumentPosition(box().element) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        expect(label.parentElement.classList).toContain('w-100')
        expect(label.parentElement.classList).toContain('justify-content-end')
      })

      // Phones and tablets: Jitsi's own page offers its app there.
      it('is not there on a phone', async () => {
        vi.stubGlobal('matchMedia', () => ({ matches: false }))
        localStorage.setItem(KEY, '1')
        await asked()

        expect(box().exists()).toBe(false)
        expect(buttons()).toEqual(['chat-video-gear', 'chat-video-cancel', 'chat-video-start'])
      })

      // A tick kept from a computer changes nothing where the box is not offered.
      it("goes the browser's way on a phone, whatever the device keeps", async () => {
        vi.stubGlobal('matchMedia', () => ({ matches: false }))
        localStorage.setItem(KEY, '1')
        browserOpens()
        serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
        threadDelivers.mockResolvedValue(true)
        await asked()

        await start()

        expect(opens).toHaveBeenCalledTimes(1)
        expect(room.location.href).toBe(ROOM_WITH_DEFAULT)
        expect(followed).toEqual([])
      })

      it('is ticked where the member left it ticked on this device', async () => {
        localStorage.setItem(KEY, '1')
        onAComputer()
        await asked()

        expect(box().element.checked).toBe(true)
      })

      // ⛔ The tick as it is now, at once -- not the state before the click.
      it("keeps the member's tick at once, and forgets it once the box is emptied", async () => {
        onAComputer()
        await asked()

        await box().setValue(true)
        expect(localStorage.getItem(KEY)).toBe('1')

        await box().setValue(false)
        expect(localStorage.getItem(KEY)).toBeNull()
      })

      it('is empty where only somebody else on this device left it ticked', async () => {
        localStorage.setItem('chat-video-in-app:somebody-else', '1')
        onAComputer()
        await asked()

        expect(box().element.checked).toBe(false)
      })

      /**
       * ⛔ No window: the room is opened in the app, not in a tab. Asked for past the cache, and
       * sent through the thread with the topic and the wish -- the invitation the browser's way
       * sends, word for word.
       */
      it("opens no window, and sends the invitation the browser's way sends", async () => {
        const topic = 'Lesekreis „Momo“'
        await tickedAndReady({ exists: true })
        await topicField().setValue(topic)
        await inDialog('email').setValue(true)

        await start()

        expect(opens).not.toHaveBeenCalled()
        expect(serverRooms).toHaveBeenCalledTimes(1)
        expect(serverRooms).toHaveBeenCalledWith({ query: chatVideoRoom, fetchPolicy: 'no-cache' })
        expect(threadDelivers).toHaveBeenCalledTimes(1)
        expect(threadDelivers).toHaveBeenCalledWith(
          {
            body: `chatThread.videoInviteTopic ${JSON.stringify({ topic, operator: ROOM.operator, url: withChatVideoTopic(ROOM.url, topic) })}`,
            notify: 'EMAIL',
          },
          'carla-id',
        )
        const inApp = threadDelivers.mock.calls[0]
        wrapper.unmount()

        await asked({ exists: true })
        await box().setValue(false)
        await topicField().setValue(topic)
        await inDialog('email').setValue(true)
        await start()
        expect(threadDelivers.mock.calls[1]).toEqual(inApp)
      })

      // The first message of a pair asks for a mail here too (E-024).
      it('asks for a mail with the first message', async () => {
        await tickedAndReady({ exists: false })

        await start()

        expect(threadDelivers.mock.calls[0][0].notify).toBe('EMAIL')
      })

      // ⛔ A room nobody else knows is not entered: the app gets it once the invitation is out.
      it('hands the room to the app once the invitation went out, and not before', async () => {
        await tickedAndReady()
        const delivery = held()
        threadDelivers.mockReturnValue(delivery.promise)

        await inDialog('start').trigger('click')
        await flushPromises()
        expect(followed).toEqual([])

        delivery.release(true)
        await flushPromises()
        expect(followed).toEqual([APP_ROOM])
      })

      it('hands it over with a topic of its own', async () => {
        await tickedAndReady()
        await topicField().setValue('Lesekreis „Momo“')

        await start()

        expect(followed).toEqual([
          'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Lesekreis%20%E2%80%9EMomo%5C%22%22',
        ])
      })

      it('waits until the app takes the focus from the page, and closes then', async () => {
        await tickedAndReady()

        await start()
        expect(dialog().exists()).toBe(true)
        expect(inDialog('start').attributes('aria-disabled')).toBe('true')

        window.dispatchEvent(new Event('blur'))
        await flushPromises()
        expect(dialog().exists()).toBe(false)
      })

      it('closes where the page is hidden behind the app', async () => {
        await tickedAndReady()
        await start()

        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
        document.dispatchEvent(new Event('visibilitychange'))
        await flushPromises()

        expect(dialog().exists()).toBe(false)
      })

      /**
       * No sign within three seconds -- the app did not open, or not so that the page could tell
       * (chatVideoApp): the question says so and offers the room in the browser and the app's
       * download page. Not a moment before the three seconds are up.
       */
      it('says so where no sign comes within three seconds, and offers the room in the browser', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        await tickedAndReady()
        await start()

        vi.advanceTimersByTime(2999)
        await flushPromises()
        expect(missed().exists()).toBe(false)
        expect(inDialog('start').attributes('aria-disabled')).toBe('true')

        vi.advanceTimersByTime(1)
        await flushPromises()
        expect(missed().exists()).toBe(true)
        expect(missed().find('[role="alert"]').text()).toBe('chatThread.videoAppMissed')
        const inBrowser = missed().find('[data-test="chat-video-app-missed-room"]')
        expect(inBrowser.attributes('href')).toBe(ROOM_WITH_DEFAULT)
        expect(inBrowser.attributes('target')).toBe('_blank')
        expect(inBrowser.attributes('rel')).toBe('noopener noreferrer')
        expect(missed().find('[data-test="chat-video-app-download"]').attributes('href')).toBe(
          'https://jitsi.org/downloads/',
        )
        expect(inDialog('open').exists()).toBe(false)
        expect(buttons()).toEqual(['chat-video-close'])
        expect(opens).not.toHaveBeenCalled()
      })

      // The window closed while the app's sign was awaited: nothing is left waiting behind it --
      // no timer, no listener (ChatVideoCall stops the watch as it goes).
      it('leaves nothing waiting for the sign once the window is gone', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        await tickedAndReady()
        await start()
        const waiting = vi.getTimerCount()
        const removed = vi.spyOn(window, 'removeEventListener')

        wrapper.unmount()

        expect(vi.getTimerCount()).toBe(waiting - 1)
        expect(removed).toHaveBeenCalledWith('blur', expect.any(Function))
      })

      // coderabbit, #4015: gone before the invitation went out -- no wait for the app starts after.
      it('starts no wait for the app when the window is gone before the invitation went out', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        await tickedAndReady()
        const delivery = held()
        threadDelivers.mockReturnValue(delivery.promise)
        await start()
        const waiting = vi.getTimerCount()
        const added = vi.spyOn(window, 'addEventListener')

        wrapper.unmount()
        delivery.release(true)
        await flushPromises()

        expect(vi.getTimerCount()).toBe(waiting)
        expect(added).not.toHaveBeenCalledWith('blur', expect.any(Function))
        expect(followed).toEqual([])
      })

      // Where the page has no focus when the room goes, no sign can come: as before, it closes.
      it('closes at once where the page has no focus to lose', async () => {
        await tickedAndReady()
        document.hasFocus.mockReturnValue(false)

        await start()

        expect(followed).toEqual([APP_ROOM])
        expect(dialog().exists()).toBe(false)
      })

      // Should the room unexpectedly be no address the app takes, the room in the browser.
      it('offers the room in the browser where the room is no address for the app', async () => {
        await tickedAndReady()
        serverRooms.mockResolvedValue({
          data: { chatVideoRoom: { ...ROOM, url: 'https://meet.ffmuc.net/' } },
        })

        await start()

        expect(followed).toEqual([])
        expect(missed().exists()).toBe(false)
        expect(inDialog('open').attributes('href')).toBe(
          'https://meet.ffmuc.net/#config.subject=%22Videoanruf%22',
        )
        expect(buttons()).toEqual(['chat-video-close'])
      })

      it.each([
        [
          'no video server can be had',
          () => serverRooms.mockRejectedValue(new Error('CHAT_VIDEO_NO_SERVER')),
          'chatThread.videoNoServer',
        ],
        [
          'the room could not be had',
          () => serverRooms.mockRejectedValue(new Error('Network error')),
          'chatThread.videoNotSent',
        ],
        [
          'the invitation did not go out',
          () => threadDelivers.mockResolvedValue(false),
          'chatThread.videoNotSent',
        ],
      ])(
        'says so where %s, with no window to close and nothing handed over',
        async (_, server, sentence) => {
          await tickedAndReady()
          server()

          await start()

          expect(opens).not.toHaveBeenCalled()
          expect(followed).toEqual([])
          expect(inDialog('problem').text()).toBe(sentence)
          expect(inDialog('problem').attributes('role')).toBe('alert')
          expect(buttons()).toEqual(['chat-video-gear', 'chat-video-cancel', 'chat-video-start'])
          expect(box().element.checked).toBe(true)
        },
      )

      // Nothing of it twice: not while the room is on its way, not while the app is awaited.
      it('takes no second press while the call is made or the app awaited', async () => {
        await tickedAndReady()
        const offer = held()
        serverRooms.mockReturnValue(offer.promise)

        await inDialog('start').trigger('click')
        await inDialog('start').trigger('click')
        offer.release({ data: { chatVideoRoom: ROOM } })
        await flushPromises()
        await inDialog('start').trigger('click')
        await flushPromises()

        expect(serverRooms).toHaveBeenCalledTimes(1)
        expect(threadDelivers).toHaveBeenCalledTimes(1)
        expect(followed).toEqual([APP_ROOM])
      })

      it('forgets the room and the sentence once the dialog is closed, and keeps the tick', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        await tickedAndReady()
        await start()
        vi.advanceTimersByTime(3000)
        await flushPromises()
        expect(missed().exists()).toBe(true)

        await inDialog('close').trigger('click')
        await camera().trigger('click')

        expect(missed().exists()).toBe(false)
        expect(inDialog('open').exists()).toBe(false)
        expect(buttons()).toEqual(['chat-video-gear', 'chat-video-cancel', 'chat-video-start'])
        expect(box().element.checked).toBe(true)
      })

      it('stops waiting for the app once the dialog is closed', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        await tickedAndReady()
        await start()

        await inDialog('cancel').trigger('click')
        vi.advanceTimersByTime(3000)
        await flushPromises()
        await camera().trigger('click')

        expect(missed().exists()).toBe(false)
        expect(buttons()).toEqual(['chat-video-gear', 'chat-video-cancel', 'chat-video-start'])
      })

      // The call's secret, the app's address as well; the storage holds the tick and no more.
      it('writes neither address into a log, and nothing but the tick into storage', async () => {
        const logs = ['log', 'info', 'warn', 'error', 'debug'].map((level) =>
          vi.spyOn(console, level),
        )
        const stores = vi.spyOn(Storage.prototype, 'setItem')
        await tickedAndReady()

        await start()

        expect(followed).toEqual([APP_ROOM])
        const written = logs.flatMap((spy) => spy.mock.calls.flat().map(String))
        expect(written.filter((line) => /k7m2x9q4t8wz/.test(line))).toEqual([])
        expect(stores.mock.calls).toEqual([[KEY, '1']])
      })
    })

    /**
     * V4b: a click on the link of a video invitation in the thread, on a computer, asks first
     * (ChatMessageText) -- through the question this window provides. The thread stand-in takes
     * what the window provides, as the text of a message does.
     */
    describe('the question before joining a call', () => {
      const joinDialog = () => wrapper.find('[data-test="chat-video-join-dialog"]')
      const inJoin = (name) => wrapper.find(`[data-test="chat-video-join${name}"]`)
      const box = () => joinDialog().find('[data-test="chat-video-app-box"]')
      const missed = () => joinDialog().find('[data-test="chat-video-app-missed"]')
      const joinButtons = () =>
        joinDialog()
          .findAll('button')
          .map((b) => b.attributes('data-test'))
      const APP_ROOM = 'jitsi-meet://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Videoanruf%22'
      const KEY = 'chat-video-in-app:me-id'

      let followed
      beforeEach(() => {
        followed = []
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
          followed.push(this.href)
        })
        vi.spyOn(document, 'hasFocus').mockReturnValue(true)
        vi.stubGlobal('matchMedia', (query) => ({
          matches: query === '(pointer: fine) and (hover: hover)',
        }))
      })

      afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
        localStorage.clear()
      })

      /** The window open, and the thread handing it the link of an invitation. */
      const clicked = async (roomUrl = ROOM_WITH_DEFAULT) => {
        mountWindow()
        await threadSays({ exists: true, mutedByMe: false })
        wrapper.findComponent({ name: 'ChatThread' }).vm.join(roomUrl)
        await flushPromises()
      }

      it('opens where the thread hands it the link of an invitation, cut short', async () => {
        await clicked()

        expect(joinDialog().exists()).toBe(true)
        const title = 'chatThread.videoJoinTitle {"name":"Carla-Sonne"}'
        expect(inJoin('-title').text()).toBe(title)
        expect(joinDialog().attributes('aria-label')).toBe(title)
        expect(joinButtons()).toEqual(['chat-video-join-cancel', 'chat-video-join'])
        expect(inJoin('').text()).toBe('chatThread.videoJoin')
        expect(box().element.checked).toBe(false)
        // No topic, no sentence, no mail: the question and its answers.
        expect(joinDialog().find('input[type="text"]').exists()).toBe(false)
        expect(joinDialog().findAll('input[type="checkbox"]')).toHaveLength(1)
        expect(dialog().exists()).toBe(false)
      })

      it('joins in a window of its own where the box is empty, in the click', async () => {
        const opens = vi.spyOn(window, 'open').mockImplementation(() => null)
        await clicked()

        await inJoin('').trigger('click')

        expect(opens).toHaveBeenCalledTimes(1)
        expect(opens).toHaveBeenCalledWith(ROOM_WITH_DEFAULT, '_blank', 'noopener,noreferrer')
        expect(followed).toEqual([])
        expect(joinDialog().exists()).toBe(false)
      })

      it('hands the room to the app where the box is ticked, and closes once the app has the focus', async () => {
        const opens = vi.spyOn(window, 'open')
        localStorage.setItem(KEY, '1')
        await clicked()
        expect(box().element.checked).toBe(true)

        await inJoin('').trigger('click')
        expect(followed).toEqual([APP_ROOM])
        expect(opens).not.toHaveBeenCalled()
        expect(joinDialog().exists()).toBe(true)
        expect(inJoin('').attributes('aria-disabled')).toBe('true')

        window.dispatchEvent(new Event('blur'))
        await flushPromises()
        expect(joinDialog().exists()).toBe(false)
      })

      it('says so where no sign comes within three seconds, with the room in the browser', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        localStorage.setItem(KEY, '1')
        await clicked()

        await inJoin('').trigger('click')
        vi.advanceTimersByTime(2999)
        await flushPromises()
        expect(missed().exists()).toBe(false)

        vi.advanceTimersByTime(1)
        await flushPromises()
        expect(missed().find('[role="alert"]').text()).toBe('chatThread.videoAppMissed')
        expect(missed().find('[data-test="chat-video-app-missed-room"]').attributes('href')).toBe(
          ROOM_WITH_DEFAULT,
        )
        expect(joinButtons()).toEqual(['chat-video-join-close'])

        await inJoin('-close').trigger('click')
        expect(joinDialog().exists()).toBe(false)
      })

      it('takes no second press while the app is awaited', async () => {
        localStorage.setItem(KEY, '1')
        await clicked()

        await inJoin('').trigger('click')
        await inJoin('').trigger('click')

        expect(followed).toEqual([APP_ROOM])
      })

      // One box in both questions, one memory.
      it('shares the box with the start: ticked in one, ticked in the other', async () => {
        await clicked()
        await box().setValue(true)
        expect(localStorage.getItem(KEY)).toBe('1')
        await inJoin('-cancel').trigger('click')

        await camera().trigger('click')

        expect(dialog().find('[data-test="chat-video-app-box"]').element.checked).toBe(true)
      })

      it('lets go of the room when cancelled, and asks anew for the next link', async () => {
        const opens = vi.spyOn(window, 'open').mockImplementation(() => null)
        await clicked()
        await inJoin('-cancel').trigger('click')
        expect(joinDialog().exists()).toBe(false)
        expect(opens).not.toHaveBeenCalled()

        const next = 'https://meet.ffmuc.net/p3r5t7v9x2z4#config.subject=%22Videoanruf%22'
        wrapper.findComponent({ name: 'ChatThread' }).vm.join(next)
        await flushPromises()
        await inJoin('').trigger('click')

        expect(opens).toHaveBeenCalledWith(next, '_blank', 'noopener,noreferrer')
      })

      it('leaves nothing waiting for the sign once the window is gone', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        localStorage.setItem(KEY, '1')
        await clicked()
        await inJoin('').trigger('click')
        const waiting = vi.getTimerCount()
        const removed = vi.spyOn(window, 'removeEventListener')

        wrapper.unmount()

        expect(vi.getTimerCount()).toBe(waiting - 1)
        expect(removed).toHaveBeenCalledWith('blur', expect.any(Function))
      })

      it('stops waiting for the app once it is closed', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        localStorage.setItem(KEY, '1')
        await clicked()
        await inJoin('').trigger('click')

        await inJoin('-cancel').trigger('click')
        vi.advanceTimersByTime(3000)
        await flushPromises()
        wrapper.findComponent({ name: 'ChatThread' }).vm.join(ROOM_WITH_DEFAULT)
        await flushPromises()

        expect(missed().exists()).toBe(false)
        expect(joinButtons()).toEqual(['chat-video-join-cancel', 'chat-video-join'])
      })

      // The call's secret: in no log and no storage.
      it('writes the room into no log and no storage', async () => {
        const logs = ['log', 'info', 'warn', 'error', 'debug'].map((level) =>
          vi.spyOn(console, level),
        )
        const stores = vi.spyOn(Storage.prototype, 'setItem')
        vi.spyOn(window, 'open').mockImplementation(() => null)
        await clicked()

        await inJoin('').trigger('click')

        const written = [...logs, stores].flatMap((spy) => spy.mock.calls.flat().map(String))
        expect(written.filter((line) => /k7m2x9q4t8wz/.test(line))).toEqual([])
      })
    })
  })

  // Real buttons that do not send a form, and none taken out of the tab order: a keyboard
  // reaches the bell and the way out.
  it('makes the bell and the send button buttons a keyboard reaches', async () => {
    mountWindow()
    await threadSays({ exists: true, mutedByMe: false })
    for (const mark of [bell(), sendButton()]) {
      expect(mark.element.tagName).toBe('BUTTON')
      expect(mark.attributes('type')).toBe('button')
      expect(mark.attributes('tabindex')).toBeUndefined()
    }
  })

  const styleOf = (file) =>
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!--[\s\S]*?-->/g, '')

  /**
   * ⛔ Plain buttons have no focus ring of their own, and nothing but the stylesheet can say
   * they have one -- jsdom draws no outlines. Comments stripped first, so the explanation
   * beside the rule cannot stand in for it.
   */
  it('gives the bell and the send button a visible focus ring, in the stylesheet', () => {
    const code = styleOf('ContactWindow.vue')
    const mark = code.match(/\.contact-window-mark:focus-visible\s*\{[^}]*\}/)
    const send = code.match(/\.send-btn:focus-visible\s*\{[^}]*\}/)

    expect(mark, 'the marks lost their focus rule').not.toBeNull()
    expect(mark[0]).toMatch(/outline:\s*2px solid/)
    expect(send, 'the send button lost its focus rule').not.toBeNull()
    expect(send[0]).toMatch(/outline:\s*2px solid/)
  })

  /**
   * The call's buttons wait -- `aria-disabled`, so a keyboard keeps its place -- and look it: "Start
   * call" while a call is being made, "Join call" while the Jitsi app is awaited (V4b). jsdom draws
   * nothing, so the stylesheet says it; comments stripped first.
   */
  it("gives the call's buttons their waiting look, in the stylesheet", () => {
    const code = styleOf('../Chat/ChatVideoCall.vue')
    // From after the tag: its first rule would otherwise begin with the tag.
    const style = code.slice(code.indexOf('>', code.indexOf('<style')) + 1)
    const rules = [...style.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selectors, body]) => ({
      selectors: selectors.split(',').map((selector) => selector.trim()),
      body,
    }))

    for (const button of ['start', 'join', 'gear']) {
      const waiting = rules.find((rule) =>
        rule.selectors.includes(`.chat-video-${button}[aria-disabled='true']`),
      )
      expect(waiting?.body, button).toMatch(/opacity:\s*0\.65/)
    }
  })

  /**
   * The gear (V5): at the left end of the footer, the other buttons pushed to the right, a hit
   * area as high as they are, and a focus ring of its own -- a plain button has none. jsdom lays
   * nothing out and draws no outlines, so the stylesheet says it; comments stripped first.
   */
  it('puts the gear at the left of the footer, as high as the buttons, with a focus ring, in the stylesheet', () => {
    const code = styleOf('../Chat/ChatVideoCall.vue')
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    const gear = rule('\\.chat-video-gear')
    expect(gear).toMatch(/margin-right:\s*auto/)
    expect(gear).toMatch(/width:\s*2\.875rem/)
    expect(gear).toMatch(/height:\s*2\.875rem/)
    expect(gear).toMatch(/background:\s*transparent/)
    expect(rule('\\.chat-video-gear:focus-visible')).toMatch(/outline:\s*2px solid/)
    expect(rule('\\.chat-video-link')).toMatch(/overflow-wrap:\s*anywhere/)
  })

  /**
   * ⛔ The marks at the right end of the send row, with the empty stretch before them, and never
   * squeezed: where the row is too narrow, the word gets smaller first (`is-tight`), and past
   * that the marks go to a line of their own rather than out of the window. A name too long for
   * its whole line still gives way. jsdom lays nothing out, so only the stylesheet can say it.
   */
  it('puts the marks at the right end and never squeezes them, in the stylesheet', () => {
    const code = styleOf('ContactWindow.vue')
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.contact-window-marks')).toMatch(/margin-left:\s*auto/)
    expect(rule('\\.contact-window-marks')).toMatch(/flex:\s*0 0 auto/)
    expect(rule('\\.contact-window-marks')).toMatch(/gap:\s*0\.5rem/)
    expect(rule('\\.contact-window-mark')).toMatch(/flex:\s*0 0 auto/)
    expect(rule('\\.contact-window-send')).toMatch(/align-items:\s*center/)
    expect(rule('\\.contact-window-send')).toMatch(/flex-wrap:\s*wrap/)
    expect(rule('\\.contact-window-name')).toMatch(/min-width:\s*0/)
    expect(rule('\\.contact-window-name')).toMatch(/text-overflow:\s*ellipsis/)
  })

  /**
   * "Sollte bei sehr langen Sprachen der Button zu breit werden, würde ich in diesem Fall auf
   * eine kleinere Schrift umschalten" (Bernd, 26.09.2026) -- and, where at 320px that alone did
   * not do it (French, Dutch, Russian, Greek), set closer (Bernd, the same morning, "B"): a
   * smaller font, less room inside the button, the marks and the row's gap closer. Each in a rule
   * of its own; the map's rules stay as they are (held above), and each tight value is held
   * against the one it replaces -- the button's own measure in the window's own rule since it
   * was set smaller than the map's (29.09.2026). Above and below it keeps that measure.
   */
  it('sets the tight row closer than its own measure, in the stylesheet', () => {
    const code = styleOf('ContactWindow.vue')
    const body = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    const px = (selector, property) =>
      Number(body(selector).match(new RegExp(`(?:^|;|\\s)${property}:\\s*([\\d.]+)(px|rem)?`))?.[1])
    const paddingX = (selector) =>
      Number(body(selector).match(/(?:^|;|\s)padding:\s*[\d.]+px\s+([\d.]+)px/)?.[1])
    const paddingY = (selector) =>
      Number(body(selector).match(/(?:^|;|\s)padding:\s*([\d.]+)px\s+[\d.]+px/)?.[1])
    const own = '\\.contact-window-send \\.send-btn'
    const tight = '\\.contact-window-send\\.is-tight \\.send-btn'

    expect(px(own, 'font-size'), 'the button lost its own size').toBe(14)
    expect(px(tight, 'font-size')).toBeLessThan(14)
    expect(paddingX(own)).toBe(14)
    expect(paddingX(tight)).toBeLessThan(14)
    expect(paddingY(own)).toBe(7)
    expect(paddingY(tight)).toBe(7)
    expect(px('\\.send-btn', 'gap')).toBe(8)
    expect(px(tight, 'gap')).toBeLessThan(8)
    expect(px('\\.contact-window-send', 'gap')).toBe(10)
    expect(px('\\.contact-window-send\\.is-tight', 'gap')).toBeLessThan(10)
    // 0.5rem between the marks, 8px at the root size; closer when tight.
    expect(body('\\.contact-window-marks')).toMatch(/gap:\s*0\.5rem/)
    expect(px('\\.contact-window-send\\.is-tight \\.contact-window-marks', 'gap')).toBeLessThan(8)
  })

  /**
   * ⛔ The sheet (below `sm`, where BModal makes the window fullscreen): the window's inside
   * one column over the whole height; the thread as high as its content and no higher than what
   * is left, scrolling inside. Without these rules the sheet would scroll as a whole -- and
   * every spec would stay green. ⛔ Not `flex: 1`: a thread that takes what is left puts one
   * message at the bottom under a gap the height of the screen (Bernd, 24.09.2026).
   */
  it('makes the window one column over the whole screen on a phone, in the stylesheet', () => {
    const code = styleOf('ContactWindow.vue')
    const sheet = code.match(/@media \(width <= 575\.98px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(sheet, 'the sheet lost its rules').not.toBe('')
    expect(sheet).toMatch(
      /\.contact-window-inner\s*\{[^}]*flex-direction:\s*column[^}]*height:\s*100%/,
    )
    expect(sheet).toMatch(/\.contact-window-thread\s*\{[^}]*flex:\s*0 1 auto/)
    // Only the thread gives way: the blocks above it keep their height.
    expect(sheet).toMatch(
      /\.contact-window-top,\s*\.contact-window-head,\s*\.contact-window-meta,\s*\.contact-window-send\s*\{[^}]*flex-shrink:\s*0/,
    )
    expect(sheet).toMatch(/\.chat-thread-scroll\)\s*\{[^}]*max-height:\s*none/)
  })

  /**
   * The conversation stands where the placeholder "conversation history -- comes with the
   * chat" stood (E-023), made for the person the window shows: their pair, and their name
   * for what a screen reader hears.
   */
  it('shows the thread with this person, where the placeholder stood', () => {
    mountWindow()
    const thread = wrapper.find('[data-test="chat-thread"]')

    expect(thread.attributes('data-who')).toBe('carla-id')
    expect(thread.attributes('data-community')).toBe('home-uuid')
    expect(thread.attributes('data-alias')).toBe('Carla-Sonne')
    expect(wrapper.find('[data-test="contact-window-later"]').exists()).toBe(false)
  })

  /**
   * ⛔ A new person is a new thread. The thread takes its pair once, when it is made; if the
   * window were ever handed somebody else while it stands open, keeping the old thread
   * would show one person's messages under another's name.
   */
  it('makes a new thread for another person', async () => {
    mountWindow()
    await wrapper.setProps({ contact: STRANGER })

    expect(threadsMade).toEqual(['carla-id', 'sarah-id'])
    expect(wrapper.find('[data-test="chat-thread"]').attributes('data-who')).toBe('sarah-id')
    expect(wrapper.find('[data-test="chat-thread"]').attributes('data-key')).toBe(
      'provence-uuid/sarah-id',
    )
  })

  // The same id in another community is another person, and a community filled in is not.
  it('makes a new thread for the same id in another community', async () => {
    mountWindow({ user: { ...CONTACT.user, communityUuid: null } })
    await wrapper.setProps({
      contact: { ...CONTACT, user: { ...CONTACT.user, communityUuid: 'provence-uuid' } },
    })

    expect(threadsMade).toEqual(['carla-id', 'carla-id'])
  })

  /**
   * ⛔ `homeCommunity` from the SERVER decides, not a comparison made in the wallet. The
   * wallet knows its own community by a name out of its own configuration, while the name
   * on a contact was written from the backend's -- two variables in two deployments. The
   * server compares community uuids instead.
   */
  it('shows the address of a member of this community', () => {
    expect(mountWindow().find('[data-test="contact-window-address"]').text()).toBe(
      'gradido.test/u/Carla-Sonne',
    )
  })

  it('shows no address for a member of another community', () => {
    expect(mountWindow(STRANGER).find('[data-test="contact-window-address"]').exists()).toBe(false)
  })

  // Opened before a contact is chosen, or after the list emptied: nothing to draw, and
  // nothing that reaches into a null.
  it('draws nothing at all without a contact', () => {
    expect(mountWindow(null).find('[data-test="contact-window-name"]').exists()).toBe(false)
  })

  /**
   * ⛔ The window could always be closed by clicking beside it, and that is exactly the
   * problem: it is a thing one has to know. A cross is the control everybody looks for.
   * (Bernd, 04.09.2026.)
   *
   * ⚠️ The accessible name is measured too, not just the presence of a button. A bare ×
   * reaches a screen reader as "times" or as nothing at all, and this window has no header
   * to name it from.
   */
  /**
   * ⛔ The cross is out of the flow, so the name beside it lays out straight through the
   * space it sits in and a long alias ran under it. The comment beside the rule claimed
   * this reservation for a week while no rule made it -- so it is measured in the
   * STYLESHEET, which is the only place jsdom lets it be seen at all.
   */
  it('puts the cross on a line of its own, above the name', () => {
    mountWindow()
    const top = wrapper.find('.contact-window-top')
    const head = wrapper.find('.contact-window-head')

    expect(top.find('[data-test="contact-window-close"]').exists()).toBe(true)
    expect(head.find('[data-test="contact-window-close"]').exists()).toBe(false)
    // The line of the cross comes first, the head after it.
    expect(
      top.element.compareDocumentPosition(head.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    // In the flow, so the head needs no room kept free at its right -- jsdom lays nothing out,
    // so the stylesheet says it.
    const code = styleOf('ContactWindow.vue')
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    expect(rule('\\.contact-window-close')).not.toMatch(/position:\s*absolute/)
    expect(rule('\\.contact-window-head')).not.toMatch(/padding-right/)
  })

  /**
   * ⛔ "Im Prinzip genauso wie im Matching, nur … in diesem dunkleren Goldton" (Bernd,
   * 24.09.2026). The map's profile window (MatchProfile.vue) and this one each carry the rules,
   * so the spec holds them against each other with the one difference swapped in -- the gold,
   * which it takes from the compose bar's send button, so the window's two gold buttons cannot
   * drift apart either. Flat again since 29.09.2026 ("wieder das etwas dunklere Gold ohne
   * Verlauf … so wie auch unten der Kreis bei dem Absende-Button"), after two days in the
   * gradient of the house's golden buttons.
   */
  it("sends with the map profile's button, in the gold of the compose bar's send button", () => {
    const rule = (file, name) =>
      styleOf(file)
        .match(new RegExp(`\\n\\.${name}\\s*\\{([^}]*)\\}`))?.[1]
        ?.replace(/\s+/g, ' ')
        .trim()
    const gold = styleOf('../Chat/ChatComposeBar.vue').match(
      /\n\.chat-compose-send\s*\{[^}]*\sbackground:\s*(#[0-9a-f]{6});/i,
    )?.[1]

    expect(gold, 'the send button lost its gold').toBeDefined()
    for (const name of ['send-btn', 'send-gradido', 'send-coin']) {
      const there = rule('../Matching/MatchProfile.vue', name)
      expect(there, `MatchProfile lost .${name}`).toBeDefined()
      expect(rule('ContactWindow.vue', name), `.${name}`).toBe(there.replaceAll('#178d81', gold))
    }
  })

  /**
   * "Dabei ist „Gradido senden“ ja nur eine von vielen Optionen, wenn auch eine der wichtigsten"
   * (Bernd, 29.09.2026, "A"): in this window the button is set smaller than the map's -- a
   * smaller font, less room above and below, a smaller coin -- in the window's own rules, which
   * outweigh the map's. On the map it is one of the profile window's two ways and keeps its
   * measure (the rules held against MatchProfile above).
   */
  it("sets the button smaller than the map's, in the stylesheet", () => {
    const code = styleOf('ContactWindow.vue')
    const body = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    const own = body('\\.contact-window-send \\.send-btn')
    const coin = body('\\.contact-window-send \\.send-coin')

    expect(own).toMatch(/(?:^|;|\s)font-size:\s*14px;/)
    expect(own).toMatch(/(?:^|;|\s)padding:\s*7px 14px;/)
    expect(coin).toMatch(/(?:^|;|\s)width:\s*18px;/)
    expect(coin).toMatch(/(?:^|;|\s)height:\s*18px;/)
    // The map's measure, which these rules outweigh.
    expect(body('\\.send-btn')).toMatch(/(?:^|;|\s)font-size:\s*15px;/)
    expect(body('\\.send-btn')).toMatch(/(?:^|;|\s)padding:\s*10px 14px;/)
    expect(body('\\.send-coin')).toMatch(/(?:^|;|\s)width:\s*20px;/)
  })

  // "Schmal" (Bernd, 24.09.2026): the button keeps the width of its word, so something can
  // stand beside it later -- a rule of its own, outside the map's rules held above.
  // And where even set closer the word is wider than the whole row (below 240px, measured), it
  // takes a second line instead of the button hanging out of the window (coderabbit, #3987) --
  // in the window's own rule; the map's rule keeps `nowrap` (held against MatchProfile above).
  it('keeps the button as wide as its word, and lets the word break only past the row, in the stylesheet', () => {
    const code = styleOf('ContactWindow.vue')
    const rule = code.match(/\n\.contact-window-send \.send-btn\s*\{([^}]*)\}/)?.[1]
    const map = code.match(/\n\.send-btn\s*\{([^}]*)\}/)?.[1]

    expect(rule, 'the button lost its own width').toBeDefined()
    expect(rule).toMatch(/flex:\s*0 1 auto/)
    expect(rule).toMatch(/min-width:\s*0/)
    expect(rule).toMatch(/white-space:\s*normal/)
    expect(rule).toMatch(/overflow-wrap:\s*anywhere/)
    expect(map).toMatch(/white-space:\s*nowrap/)
  })

  /**
   * The smaller font where the word leaves the marks no room beside it -- and only there (Bernd,
   * 26.09.2026). Measured, not decided by the language. jsdom lays nothing out and has no
   * ResizeObserver: the test lays the row out itself, says when sizes changed, and runs the
   * frames when it says so.
   */
  describe('the send row', () => {
    const observers = new Set()
    class ResizeObserverStandIn {
      constructor(callback) {
        this.callback = callback
        this.watched = []
        observers.add(this)
      }

      observe(element) {
        this.watched.push(element)
      }

      disconnect() {
        observers.delete(this)
      }
    }
    const sizesChanged = () => {
      for (const observer of observers) observer.callback([])
    }

    let frames = []
    let frameIds = 0
    const nextFrame = async () => {
      const due = frames
      frames = []
      for (const frame of due) frame.run()
      await flushPromises()
    }

    beforeEach(() => {
      vi.stubGlobal('ResizeObserver', ResizeObserverStandIn)
      vi.stubGlobal('requestAnimationFrame', (run) => {
        frameIds += 1
        frames.push({ id: frameIds, run })
        return frameIds
      })
      vi.stubGlobal('cancelAnimationFrame', (id) => {
        frames = frames.filter((frame) => frame.id !== id)
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      observers.clear()
      frames = []
    })

    /**
     * The row as a browser lays it out, in the widths measured in the wallet at 320px (de, three
     * marks): the row 272; the button 175.9 in its own measure and 145.2 set closer; the marks
     * 93.6 and 85.6; 10 between them in the row's own gap -- jsdom applies no stylesheet, so the
     * row carries that one inline. `row: 0` is a row not laid out yet (the dialog still hidden).
     */
    const layOut = ({
      row,
      button = 175.9,
      tightButton = 145.2,
      marks = 93.6,
      tightMarks = 85.6,
    }) => {
      const rowElement = wrapper.find('.contact-window-send').element
      const isTight = () => rowElement.classList.contains('is-tight')
      rowElement.style.columnGap = '10px'
      Object.defineProperty(rowElement, 'clientWidth', {
        configurable: true,
        get: () => Math.round(row),
      })
      rowElement.getBoundingClientRect = () => ({ width: row })
      rowElement.querySelector('.send-btn').getBoundingClientRect = () => ({
        width: isTight() ? tightButton : button,
      })
      rowElement.querySelector('.contact-window-marks').getBoundingClientRect = () => ({
        width: isTight() ? tightMarks : marks,
      })
    }
    const tight = () => wrapper.find('.contact-window-send').classes('is-tight')

    const openWithMarks = async () => {
      mountWindow()
      await threadSays({ exists: true, mutedByMe: false })
    }

    it('keeps the row in its own measure where the marks fit beside the button', async () => {
      await openWithMarks()
      layOut({ row: 312 })
      sizesChanged()
      await nextFrame()

      expect(tight()).toBe(false)
    })

    it('sets the row closer where the word leaves the marks no room', async () => {
      await openWithMarks()
      layOut({ row: 272 })
      sizesChanged()
      await nextFrame()

      expect(tight()).toBe(true)
    })

    // 175.9 + 10 + 93.6 = 279.5 does not fit into 270; set closer (145.2 + 10 + 85.6 = 240.8) it
    // would. Read in the measure the row has just then, it would go back, not fit, go close
    // again -- a frame each, as long as the window is open.
    it('decides on the row in its own measure, so it does not flip back', async () => {
      await openWithMarks()
      layOut({ row: 270 })
      sizesChanged()
      await nextFrame()
      expect(tight()).toBe(true)

      sizesChanged()
      await nextFrame()
      expect(tight()).toBe(true)
    })

    it('goes back to its own measure where the window grows', async () => {
      await openWithMarks()
      layOut({ row: 272 })
      sizesChanged()
      await nextFrame()
      expect(tight()).toBe(true)

      layOut({ row: 390 })
      sizesChanged()
      await nextFrame()
      expect(tight()).toBe(false)
    })

    // A row of no width is one not laid out yet: every word would "not fit" into it.
    it('decides nothing before the window is laid out', async () => {
      await openWithMarks()
      layOut({ row: 0 })
      sizesChanged()
      await nextFrame()

      expect(tight()).toBe(false)
    })

    // ⚠️ The row's height changes with the font, and a size changed from inside the observer's
    // callback is one the browser reports as a loop: the decision waits for the next frame.
    it('decides in the next frame, not in the callback', async () => {
      await openWithMarks()
      layOut({ row: 272 })
      sizesChanged()
      await flushPromises()
      expect(tight()).toBe(false)

      await nextFrame()
      expect(tight()).toBe(true)
    })

    it('watches the row and both its parts, and lets go when the window closes', async () => {
      await openWithMarks()
      const row = wrapper.find('.contact-window-send').element
      const [observer] = observers

      expect(observers.size).toBe(1)
      expect(observer.watched).toEqual([row, ...row.children])

      await wrapper.setProps({ modelValue: false })
      await flushPromises()
      expect(observers.size).toBe(0)
    })
  })

  it('closes from a cross that says what it is', async () => {
    mountWindow()
    const cross = wrapper.find('[data-test="contact-window-close"]')

    expect(cross.exists()).toBe(true)
    expect(cross.attributes('aria-label')).toBe('form.close')

    await cross.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})
