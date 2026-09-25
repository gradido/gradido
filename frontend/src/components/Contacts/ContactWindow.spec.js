// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ContactWindow from './ContactWindow.vue'
import { chatVideoRoom } from '@/graphql/chat.graphql'

const pushSpy = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushSpy }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      typeof values === 'number'
        ? `${key}:${values}`
        : values
          ? `${key} ${JSON.stringify(values)}`
          : key,
    d: (date, format) => `${format}(${date.toISOString()})`,
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
vi.mock('vuex', () => ({
  useStore: () => ({ state: { communityUuid: 'HOME-UUID' } }),
}))

/** What the server answers to `setChatConversationMuted`; a test decides, or makes it throw. */
const serverMutes = vi.fn()
/**
 * What the server answers to the video room query (`client.query`): a test decides, or makes it
 * throw. Called with the whole options, so a test can say how it was asked.
 */
const serverRooms = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: (variables) => serverMutes(variables) }),
  useApolloClient: () => ({ client: { query: (options) => serverRooms(options) } }),
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

describe('ContactWindow', () => {
  let wrapper

  const mountWindow = (contact = CONTACT) => {
    wrapper = mount(ContactWindow, {
      props: { modelValue: true, contact },
      global: {
        mocks: {
          $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
        },
        stubs: {
          // Shows what it holds while it is open, the footer under it -- the window itself is
          // always open here; the question before a video call opens and closes.
          BModal: {
            props: { modelValue: Boolean },
            emits: ['update:modelValue'],
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
          // The thread reads the server; its own spec is about that. Here it only has to say
          // whom it was made for, count how often it was made, and take a video invitation
          // (`deliver`, which the real one exposes) for whom it was made.
          ChatThread: {
            name: 'ChatThread',
            props: { member: Object, alias: String, memberKey: String },
            emits: ['chatConversation'],
            mounted() {
              threadsMade.push(this.member.gradidoID)
            },
            methods: {
              deliver(message) {
                return threadDelivers(message, this.member.gradidoID)
              },
            },
            template:
              '<div data-test="chat-thread" :data-who="member.gradidoID" :data-community="String(member.communityUuid)" :data-alias="alias" :data-key="memberKey" />',
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
    threadDelivers.mockReset()
    toastSuccess.mockClear()
    toastError.mockClear()
    threadsMade = []
    vi.restoreAllMocks()
  })

  /** What the thread tells the window once its first page is in (ChatThread, `chatConversation`). */
  const threadSays = async (conversation) => {
    wrapper.findComponent({ name: 'ChatThread' }).vm.$emit('chatConversation', conversation)
    await flushPromises()
  }
  const bell = () => wrapper.find('[data-test="contact-window-bell"]')
  const sendButton = () => wrapper.find('[data-test="contact-window-send"]')

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
   * The heart behind the name, as it stands in every list of the wallet (Bernd, 24.09.2026):
   * the same component -- favouring somebody is not one of the ways out.
   */
  it('puts the heart behind the name, as in every list', () => {
    mountWindow()
    const line = wrapper.find('.contact-window-name-line')
    const [name, heart] = line.element.children

    expect(name.getAttribute('data-test')).toBe('contact-window-name')
    expect(heart.getAttribute('data-test')).toBe('heart')
    expect(heart.getAttribute('data-id')).toBe('carla-id')
  })

  /**
   * Behind the name, in Bernd's order (E-031): the heart and the bell, two marks of one's own
   * on this person. The coin that stood third went under the figures as a button with its word
   * (Bernd, 24.09.2026), and its place went to the camera (E-033, V2).
   */
  it('puts heart, bell and camera behind the name, in this order', async () => {
    mountWindow()
    await threadSays({ exists: true, mutedByMe: false })

    const marks = [...wrapper.find('.contact-window-name-line').element.children].map((e) =>
      e.getAttribute('data-test'),
    )
    expect(marks).toEqual([
      'contact-window-name',
      'heart',
      'contact-window-bell',
      'contact-window-video',
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
   * begins -- and no "Send e-mail" beside it.
   */
  it('offers one way out, with its word, under the figures and above the thread', () => {
    mountWindow()
    const row = wrapper.find('.contact-window-send')
    const meta = wrapper.find('[data-test="contact-window-meta"]').element
    const thread = wrapper.find('[data-test="chat-thread"]').element

    expect(row.element.children).toHaveLength(1)
    expect(sendButton().text()).toBe('contacts.sendGradido')
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
    const dialog = () => wrapper.find('[data-test="contact-window-video-dialog"]')
    const inDialog = (name) => wrapper.find(`[data-test="contact-window-video-${name}"]`)

    /** A room as the server hands it out (V1): address, host, and who runs the server. */
    const ROOM = {
      url: 'https://meet.ffmuc.net/k7m2x9q4t8wz',
      host: 'meet.ffmuc.net',
      operator: 'Freifunk München (Freie Netze München e. V.)',
    }

    /**
     * The room's window as `window.open` hands it back: it can be sent to an address and
     * closed, and it says whether it still reaches back to the wallet (`opener`).
     */
    let room
    let opens
    const browserOpens = (answer) => {
      room = { opener: window, location: { href: '' }, close: vi.fn() }
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
    })

    it('empties the box again for the next question', async () => {
      await asked({ exists: true })
      await inDialog('email').setValue(true)
      await inDialog('cancel').trigger('click')

      await camera().trigger('click')
      expect(inDialog('email').element.checked).toBe(false)
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
          body: `chatThread.videoInvite ${JSON.stringify({ operator: ROOM.operator, url: ROOM.url })}`,
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
        `chatThread.videoInvite ${JSON.stringify({ operator: ROOM.host, url: ROOM.url })}`,
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

      expect(room.location.href).toBe(ROOM.url)
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
      expect(room.location.href).toBe(ROOM.url)
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
      expect(link.attributes('href')).toBe(ROOM.url)
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      expect(inDialog('start').exists()).toBe(false)
      expect(inDialog('close').text()).toBe('form.close')
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
      expect(room.location.href).toBe(ROOM.url)

      first.release({ data: { chatVideoRoom: { ...ROOM, url: 'https://meet.ffmuc.net/late' } } })
      await flushPromises()
      expect(threadDelivers).toHaveBeenCalledTimes(1)
      expect(room.location.href).toBe(ROOM.url)
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
    it('writes the address into no log and no storage', async () => {
      const logs = ['log', 'info', 'warn', 'error', 'debug'].map((level) =>
        vi.spyOn(console, level),
      )
      const stores = [vi.spyOn(Storage.prototype, 'setItem')]
      browserOpens(null)
      serverRooms.mockResolvedValue({ data: { chatVideoRoom: ROOM } })
      threadDelivers.mockResolvedValue(true)
      await asked()

      await start()

      expect(inDialog('open').attributes('href')).toBe(ROOM.url)
      const written = [...logs, ...stores].flatMap((spy) => spy.mock.calls.flat().map(String))
      expect(written.filter((line) => line.includes('k7m2x9q4t8wz'))).toEqual([])
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
   * ⛔ The name gives way before the marks do (E-031): the marks may not shrink, the name may.
   * jsdom lays nothing out, so only the stylesheet can say it.
   */
  it('lets the name give way before the marks, in the stylesheet', () => {
    const code = styleOf('ContactWindow.vue')
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.contact-window-name')).toMatch(/min-width:\s*0/)
    expect(rule('\\.contact-window-mark')).toMatch(/flex:\s*0 0 auto/)
    expect(rule('\\.contact-window-heart')).toMatch(/flex:\s*0 0 auto/)
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
   * drift apart either.
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

  // "Schmal" (Bernd, 24.09.2026): the button keeps the width of its word, so something can
  // stand beside it later -- a rule of its own, outside the map's rules held above.
  it('keeps the button as wide as its word, in the stylesheet', () => {
    const rule = styleOf('ContactWindow.vue').match(
      /\n\.contact-window-send \.send-btn\s*\{([^}]*)\}/,
    )?.[1]

    expect(rule, 'the button lost its own width').toBeDefined()
    expect(rule).toMatch(/flex:\s*0 1 auto/)
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
