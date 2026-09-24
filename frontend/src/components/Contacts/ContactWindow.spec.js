// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mount } from '@vue/test-utils'
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
          IMdiEmailFastOutline: true,
          // The thread reads the server; its own spec is about that. Here it only has to say
          // whom it was made for, and count how often it was made.
          ChatThread: {
            name: 'ChatThread',
            props: { member: Object, alias: String },
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
    threadsMade = []
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

    it('still names the member and still offers both ways to reach them', () => {
      mountWindow(justTheMember)

      expect(wrapper.find('[data-test="contact-window-name"]').text()).toBe('Carla-Sonne')
      expect(wrapper.find('[data-test="contact-window-send"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="contact-window-email"]').exists()).toBe(true)
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

  it('sends Gradido to the send form, with the person already named', async () => {
    mountWindow()
    await wrapper.find('[data-test="contact-window-send"]').trigger('click')

    // ⛔ The mode is named in BOTH directions. This window stands beside /send, so a tap
    // only changes the params and the query -- the form is patched, not rebuilt -- and
    // naming only the e-mail half left this button unable to bring a form that was already
    // in e-mail mode back to sending Gradido.
    expect(pushSpy).toHaveBeenCalledWith({
      path: '/send/home-uuid/carla-id',
      query: { art: 'send' },
    })
  })

  // The e-mail half of the same form, carrying its mode -- the way the profile window on
  // the map already does it. ⛔ Not a second route and not a second piece of federation
  // knowledge: the send form is what knows the foreign branch.
  it('sends an e-mail through the same form, in its e-mail mode', async () => {
    mountWindow(STRANGER)
    await wrapper.find('[data-test="contact-window-email"]').trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      path: '/send/provence-uuid/sarah-id',
      query: { art: 'email' },
    })
  })

  it('closes itself on the way out, so it is not standing open behind the form', async () => {
    mountWindow()
    await wrapper.find('[data-test="contact-window-send"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
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

  // The two ways out, and only those two: both of them send, "Send Gradido" first.
  it('offers the two ways out together, and nothing else with them', () => {
    mountWindow()
    const ways = wrapper.find('[data-test="contact-window-send-ways"]').element.children

    expect(ways).toHaveLength(2)
    expect(ways[0].getAttribute('data-test')).toBe('contact-window-send')
    expect(ways[0].textContent.trim()).toBe('contacts.sendGradido')
    expect(ways[1].getAttribute('data-test')).toBe('contact-window-email')
    expect(ways[1].textContent.trim()).toBe('contacts.sendEmail')
  })

  // Real buttons that do not send a form, and none taken out of the tab order: a keyboard
  // reaches every way out of this window.
  it('makes both ways out buttons a keyboard reaches', () => {
    mountWindow()
    for (const test of ['contact-window-send', 'contact-window-email']) {
      const button = wrapper.find(`[data-test="${test}"]`)
      expect(button.element.tagName).toBe('BUTTON')
      expect(button.attributes('type')).toBe('button')
      expect(button.attributes('tabindex')).toBeUndefined()
    }
  })

  const styleOf = (file) =>
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!--[\s\S]*?-->/g, '')

  /**
   * ⛔ Without Bootstrap's `.btn` a plain button has no focus ring of its own, and nothing but
   * the stylesheet can say it has one -- jsdom draws no outlines. Comments stripped first, so
   * the explanation beside the rule cannot stand in for it.
   */
  it('gives the two ways out a visible focus ring, in the stylesheet', () => {
    const rule = styleOf('ContactWindow.vue').match(/\.send-btn:focus-visible\s*\{[^}]*\}/)

    expect(rule, 'the buttons lost their focus rule').not.toBeNull()
    expect(rule[0]).toMatch(/outline:\s*2px solid/)
  })

  /**
   * ⚠️ The one place this window parts from the map's: a row that wraps, instead of the map
   * window's switch at 420 px. This window is narrower than the screen, and at 430 px the two
   * labels ran past it in es, fr, nl, ru and el (measured). jsdom lays nothing out, so only
   * the stylesheet can say the row wraps.
   */
  it('puts the two ways out one under the other where they do not fit side by side', () => {
    const rule = styleOf('ContactWindow.vue').match(/\.contact-window-send\s*\{[^}]*\}/)

    expect(rule, 'the row of the two ways out lost its rule').not.toBeNull()
    expect(rule[0]).toMatch(/flex-wrap:\s*wrap/)
  })

  /**
   * ⛔ "Exactly the two buttons we have elsewhere, on the map for instance" (Bernd, 24.09.2026).
   * The map's profile window (MatchProfile.vue) and this one each carry the rules, so the
   * spec holds them against each other: a colour, a radius or a size changed in one place
   * and not the other fails here, rather than two send buttons drifting apart unnoticed.
   */
  it('sends with the very buttons of the map profile window', () => {
    const rules = (file) => {
      const code = styleOf(file)
      return Object.fromEntries(
        ['send-btn', 'send-gradido', 'send-email', 'send-coin', 'send-mail-icon'].map((name) => {
          const found = code.match(new RegExp(`\\n\\.${name}\\s*\\{([^}]*)\\}`))
          return [name, found && found[1].replace(/\s+/g, ' ').trim()]
        }),
      )
    }
    const here = rules('ContactWindow.vue')
    const there = rules('../Matching/MatchProfile.vue')

    expect(Object.values(there).every(Boolean), 'MatchProfile lost one of the rules').toBe(true)
    expect(here).toEqual(there)
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
  it('reserves the room the cross takes, in the stylesheet', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ContactWindow.vue'),
      'utf8',
    )
    const head = source.match(/\.contact-window-head\s*\{[^}]*\}/)

    expect(head, '.contact-window-head no longer exists').not.toBeNull()
    expect(head[0]).toMatch(/padding-right:\s*[\d.]+rem/)
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
