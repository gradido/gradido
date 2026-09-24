// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ContactWindow from './ContactWindow.vue'

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

/** What the server answers to `setChatConversationMuted`; a test decides, or makes it throw. */
const serverMutes = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: (variables) => serverMutes(variables) }),
}))

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
        mocks: { $t: (key) => key },
        stubs: {
          BModal: { template: '<div><slot /></div>' },
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
          // The thread reads the server; its own spec is about that. Here it only has to say
          // whom it was made for, and count how often it was made.
          ChatThread: {
            name: 'ChatThread',
            props: { member: Object, alias: String },
            emits: ['chatConversation'],
            mounted() {
              threadsMade.push(this.member.gradidoID)
            },
            template:
              '<div data-test="chat-thread" :data-who="member.gradidoID" :data-community="String(member.communityUuid)" :data-alias="alias" />',
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
    toastSuccess.mockClear()
    toastError.mockClear()
    threadsMade = []
  })

  /** What the thread tells the window once its first page is in (ChatThread, `chatConversation`). */
  const threadSays = async (conversation) => {
    wrapper.findComponent({ name: 'ChatThread' }).vm.$emit('chatConversation', conversation)
    await flushPromises()
  }
  const bell = () => wrapper.find('[data-test="contact-window-bell"]')
  const coin = () => wrapper.find('[data-test="contact-window-coin"]')

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
      expect(coin().exists()).toBe(true)
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

  // The coin: the send form with the person already named, as the map's profile window opens it.
  it('sends Gradido to the send form, with the person already named', async () => {
    mountWindow()
    await coin().trigger('click')

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
    await coin().trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      path: '/send/provence-uuid/sarah-id',
      query: { art: 'send' },
    })
  })

  it('closes itself on the way out, so it is not standing open behind the form', async () => {
    mountWindow()
    await coin().trigger('click')

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
   * on this person, then the coin, the one thing that goes somewhere.
   */
  it('puts heart, bell and coin behind the name, in this order', async () => {
    mountWindow()
    await threadSays({ exists: true, mutedByMe: false })

    const marks = [...wrapper.find('.contact-window-name-line').element.children].map((e) =>
      e.getAttribute('data-test'),
    )
    expect(marks).toEqual([
      'contact-window-name',
      'heart',
      'contact-window-bell',
      'contact-window-coin',
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

  it('gives the coin its name, for the ear and under the pointer', () => {
    mountWindow()
    expect(coin().attributes('aria-label')).toBe('contacts.sendGradido')
    expect(coin().attributes('title')).toBe('contacts.sendGradido')
    expect(coin().find('img').attributes('alt')).toBe('')
  })

  // Gradido's own golden coin, the one on the sign-in page (Bernd, 24.09.2026) -- not a glyph
  // on a disc of its own.
  it("shows Gradido's golden coin, as on the sign-in page", () => {
    mountWindow()
    expect(coin().find('img').attributes('src')).toBe('/img/brand/gradido_coin_128x128.png')
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
  })

  // Real buttons that do not send a form, and none taken out of the tab order: a keyboard
  // reaches the bell and the coin.
  it('makes the bell and the coin buttons a keyboard reaches', async () => {
    mountWindow()
    await threadSays({ exists: true, mutedByMe: false })
    for (const mark of [bell(), coin()]) {
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
  it('gives the bell and the coin a visible focus ring, in the stylesheet', () => {
    const rule = styleOf('ContactWindow.vue').match(
      /\.contact-window-mark:focus-visible\s*\{[^}]*\}/,
    )

    expect(rule, 'the marks lost their focus rule').not.toBeNull()
    expect(rule[0]).toMatch(/outline:\s*2px solid/)
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
   * one column over the whole height, the thread taking what is left and scrolling inside,
   * the compose bar at the bottom. Without these rules the sheet would hang its content from
   * the top and scroll as a whole -- and every spec would stay green.
   */
  it('makes the window one column over the whole screen on a phone, in the stylesheet', () => {
    const code = styleOf('ContactWindow.vue')
    const sheet = code.match(/@media \(width <= 575\.98px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(sheet, 'the sheet lost its rules').not.toBe('')
    expect(sheet).toMatch(
      /\.contact-window-inner\s*\{[^}]*flex-direction:\s*column[^}]*height:\s*100%/,
    )
    expect(sheet).toMatch(/\.contact-window-thread\s*\{[^}]*flex:\s*1 1 auto/)
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

  // The coin midway between the other marks and the compose bar's send button (Bernd,
  // 24.09.2026): at the marks' size it looked smaller than the button below, at the button's
  // size a touch too large. Held in both stylesheets.
  it('makes the coin midway between the other marks and the send button', () => {
    const rems = (file, selector) => {
      const body = styleOf(file).match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
      return ['width', 'height'].map((side) =>
        Number(body.match(new RegExp(`(?:^|\\s)${side}:\\s*([\\d.]+)rem;`))?.[1] ?? NaN),
      )
    }
    const mark = rems('ContactWindow.vue', '\\.contact-window-mark')
    const send = rems('../Chat/ChatComposeBar.vue', '\\.chat-compose-send')
    const coin = rems('ContactWindow.vue', '\\.contact-window-coin')

    expect([...mark, ...send].every(Number.isFinite), 'a size went missing').toBe(true)
    expect(coin[0]).toBeCloseTo((mark[0] + send[0]) / 2, 4)
    expect(coin[1]).toBeCloseTo((mark[1] + send[1]) / 2, 4)
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
