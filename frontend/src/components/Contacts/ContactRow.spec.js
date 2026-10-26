// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ContactRow from './ContactRow.vue'
import { forgetAllMemberAvatars } from '@/composables/useMemberAvatars'
import { LIST_AVATAR_SIZE } from '@/constants'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      typeof values === 'number'
        ? `${key}:${values}`
        : values
          ? `${key} ${JSON.stringify(values)}`
          : key,
    d: (date) => `d(${date.toISOString()})`,
    n: (value) => `n(${value})`,
  }),
}))

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

const here = dirname(fileURLToPath(import.meta.url))

const CONTACT = {
  user: {
    communityUuid: 'home',
    communityName: 'Gradido-Akademie',
    gradidoID: 'carla',
    alias: 'Carla-Sonne',
    avatarColorIndex: 2,
  },
  firstAt: '2026-07-01T10:00:00.000Z',
  lastAt: '2026-09-01T18:42:00.000Z',
  bookings: 12,
  favorite: true,
}

describe('ContactRow', () => {
  let wrapper

  const mountWith = (contact = CONTACT) => {
    wrapper = mount(ContactRow, {
      props: { contact },
      global: {
        mocks: {
          $t: (key, values) =>
            typeof values === 'number'
              ? `${key}:${values}`
              : values
                ? `${key} ${JSON.stringify(values)}`
                : key,
          $d: (date) => `d(${date.toISOString()})`,
        },
        stubs: {
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
          AppAvatar: {
            props: ['initials', 'src', 'size'],
            template: '<i data-test="avatar" :data-initials="initials" :data-size="size" />',
          },
          // Does what the real one does: appends the community, unless told not to.
          Name: {
            props: {
              linkedUser: Object,
              withCommunity: { type: Boolean, default: true },
              opens: { type: Boolean, default: true },
            },
            template:
              '<span data-test="name" :data-opens="String(opens)">{{ linkedUser.alias }}{{ withCommunity && linkedUser.communityName ? " / " + linkedUser.communityName : "" }}</span>',
          },
          FavoriteHeart: {
            props: ['member'],
            template: '<i data-test="heart" :data-id="member.gradidoID" />',
          },
        },
      },
    })
    return wrapper
  }

  afterEach(() => {
    wrapper?.unmount()
    forgetAllMemberAvatars()
  })

  it('names the person through the same component the booking row uses', () => {
    mountWith()
    expect(wrapper.find('[data-test="name"]').text()).toBe('Carla-Sonne')
  })

  // Mockup V02: the community stands under the name in a line of its own -- not behind
  // it, where the booking row puts it for a member of another community.
  it('shows the community in a line of its own, not behind the name', () => {
    mountWith()
    expect(wrapper.find('[data-test="contact-community"]').text()).toBe('Gradido-Akademie')
    expect(wrapper.find('[data-test="name"]').text()).not.toContain('/')
  })

  it('has no community line when the server named none', () => {
    mountWith({ ...CONTACT, user: { ...CONTACT.user, communityName: null } })
    expect(wrapper.find('[data-test="contact-community"]').exists()).toBe(false)
  })

  it('says how often and how recently', () => {
    mountWith()
    const meta = wrapper.find('[data-test="contact-meta"]').text()
    expect(meta).toContain('contacts.bookings:12')
    expect(meta).toContain('contacts.last')
    expect(meta).toContain('2026-09-01T18:42:00.000Z')
  })

  /**
   * ⛔ The one line the second source exists for. Somebody who came here over this member
   * is a contact from that moment, with nothing counted yet -- and the plural rule handed
   * that zero writes "0 bookings · last on …" under their name, which is true and is the
   * wrong thing to say to somebody who has just arrived (KF-016 A1).
   */
  describe('a contact with nothing counted yet', () => {
    const ARRIVED = { ...CONTACT, bookings: 0, origin: 'ARRIVAL' }

    it('says what made them contacts instead of how often', () => {
      mountWith(ARRIVED)
      expect(wrapper.find('[data-test="contact-meta"]').text()).toBe('contacts.origin.arrival')
    })

    it('never puts the zero through the plural rule', () => {
      mountWith(ARRIVED)
      const meta = wrapper.find('[data-test="contact-meta"]').text()
      expect(meta).not.toContain('contacts.bookings')
      expect(meta).not.toContain('contacts.last')
    })

    it('says it the other way round for whoever showed this member Gradido', () => {
      mountWith({ ...CONTACT, bookings: 0, origin: 'REFERRER' })
      expect(wrapper.find('[data-test="contact-meta"]').text()).toBe('contacts.origin.referrer')
    })

    // ⚠️ A server one version ahead could name an origin this wallet has no word for.
    // Saying nothing is the answer; a raw translation key under somebody's name is not.
    it('says nothing at all for an origin it does not know', () => {
      mountWith({ ...CONTACT, bookings: 0, origin: 'SOMETHING_NEW' })
      expect(wrapper.find('[data-test="contact-meta"]').text()).toBe('')
    })

    // The row has ONE line: where there are bookings it stays the bookings, origin or not.
    // Both are shown in the window, which has the room (ContactWindow.vue).
    it('keeps the bookings line for somebody who is both', () => {
      mountWith({ ...CONTACT, origin: 'ARRIVAL' })
      const meta = wrapper.find('[data-test="contact-meta"]').text()
      expect(meta).toContain('contacts.bookings:12')
      expect(meta).not.toContain('contacts.origin')
    })
  })

  it('hands the member to the heart', () => {
    mountWith()
    expect(wrapper.find('[data-test="heart"]').attributes('data-id')).toBe('carla')
  })

  it('draws the face from the alias, like the booking row', () => {
    mountWith()
    expect(wrapper.find('[data-test="avatar"]').attributes('data-initials')).toBe('CA')
  })

  // One size for every list of people in the wallet, and this list was 42 -- too small for a
  // face that is itself a control (Bernd, 11.09.2026). See LIST_AVATAR_SIZE.
  it('draws the face at the size every list of people uses', () => {
    mountWith()
    expect(wrapper.find('[data-test="avatar"]').attributes('data-size')).toBe(
      String(LIST_AVATAR_SIZE),
    )
  })

  /**
   * KF-010: a tap on a contact opens the contact window. The row says WHO was tapped; the
   * list owns the window.
   */
  it('says which person was tapped', async () => {
    mountWith()
    await wrapper.find('[data-test="contact-row-open"]').trigger('click')

    expect(wrapper.emitted('open')).toEqual([[CONTACT]])
  })

  /**
   * ⛔ And the name inside opens nothing of its own. The row is the button here; `Name`
   * carries its own control everywhere the row means something else (a booking row toggles
   * its details), and a button nested inside this one would reach BOTH -- one word with two
   * handlers, and an accessible name made of two controls.
   */
  it('does not let the name be a second control under the button', () => {
    mountWith()
    expect(wrapper.find('[data-test="name"]').attributes('data-opens')).toBe('false')
  })

  /**
   * The gold dot while a message from this person waits unread (mockup V03): at the end of
   * the row, and inside the button, so the row's name carries its sentence. The number is
   * the server's, read off the row as the list delivered it.
   */
  describe('the dot for unread messages', () => {
    const dot = () => wrapper.find('[data-test="chat-unread-contact-dot"]')

    it('stands inside the button, after the text', () => {
      mountWith({ ...CONTACT, unreadChatMessages: 2 })
      const button = wrapper.find('[data-test="contact-row-open"]')
      expect(button.find('[data-test="chat-unread-contact-dot"]').exists()).toBe(true)
      const parts = [...button.element.children]
      expect(parts.at(-1)).toBe(dot().element)
      expect(parts[0].contains(wrapper.find('[data-test="contact-meta"]').element)).toBe(true)
    })

    it("hands the server's number to the sentence", () => {
      mountWith({ ...CONTACT, unreadChatMessages: 2 })
      expect(dot().text()).toBe('contacts.unreadChatMessages {"n":2}')
    })

    it('is not there while nothing waits, nor for a row without the number', () => {
      mountWith({ ...CONTACT, unreadChatMessages: 0 })
      expect(dot().exists()).toBe(false)
      wrapper.unmount()
      mountWith(CONTACT)
      expect(dot().exists()).toBe(false)
    })

    // The heart is a control of its own and stays out of the button; the dot must not
    // take its place.
    it('leaves the heart where it was, outside the button', () => {
      mountWith({ ...CONTACT, unreadChatMessages: 1 })
      const button = wrapper.find('[data-test="contact-row-open"]')
      expect(button.find('[data-test="heart"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="heart"]').exists()).toBe(true)
    })

    // What keeps the dot at the end: the button is a row of two, and the text gives way
    // (min-width 0) rather than pushing the dot out of it.
    it('keeps the dot at the end by a row of two in the button', () => {
      const styles = readFileSync(resolve(here, './ContactRow.vue'), 'utf8')
        .split('<style scoped>')[1]
        .replace(/\/\*[\s\S]*?\*\//g, '')
      const rule = (selector) => styles.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`))[1]
      expect(rule('\\.contact-row-open')).toMatch(/display:\s*flex/)
      expect(rule('\\.contact-row-text')).toMatch(/flex:\s*1/)
      expect(rule('\\.contact-row-text')).toMatch(/min-width:\s*0/)
    })
  })

  /**
   * The line of the latest word (E-083, Bernd, 23.10.2026): the beginning of the latest message,
   * or of the latest booking where that came later -- instead of the community's line where the
   * person belongs to the member's own community, and always the last line of the row, under how
   * often and how recently (E-085, Bernd, 26.10.2026).
   */
  describe('the line of the latest word', () => {
    const MESSAGE = {
      mine: false,
      excerpt: 'Morgen um zehn im Garten?',
      hasImage: false,
      amount: null,
    }
    const BOOKING = {
      mine: true,
      excerpt: 'Danke für Deine Hilfe',
      hasImage: false,
      amount: '20.00',
    }
    const lineOf = () => wrapper.find('[data-test="chat-preview-line"]')
    // The lines of the row's text, in the order it shows them.
    const lines = () => [...wrapper.find('.contact-row-text').element.children]

    it("stands instead of the community's line for somebody of the member's own community", () => {
      mountWith({ ...CONTACT, homeCommunity: true, chatPreview: MESSAGE })
      expect(wrapper.find('[data-test="contact-community"]').exists()).toBe(false)
      expect(lineOf().text()).toBe('Morgen um zehn im Garten?')
    })

    it('stands last for somebody of another community, whose community keeps its line', () => {
      mountWith({
        ...CONTACT,
        user: { ...CONTACT.user, communityName: 'Gradido Bremen' },
        homeCommunity: false,
        chatPreview: MESSAGE,
      })
      const text = wrapper.find('[data-test="contact-row-open"]').text()
      expect(wrapper.find('[data-test="contact-community"]').text()).toBe('Gradido Bremen')
      expect(text.indexOf('Gradido Bremen')).toBeLessThan(text.indexOf('contacts.bookings:12'))
      expect(text.indexOf('contacts.bookings:12')).toBeLessThan(text.indexOf('Morgen um zehn'))
      expect(lines().at(-1)).toBe(lineOf().element)
    })

    it('leaves the row as it was where there is nothing to show', () => {
      mountWith({ ...CONTACT, homeCommunity: true, chatPreview: null })
      expect(lineOf().exists()).toBe(false)
      expect(wrapper.find('[data-test="contact-community"]').text()).toBe('Gradido-Akademie')
    })

    it('stands last, under the line of how often and how recently', () => {
      mountWith({ ...CONTACT, homeCommunity: true, chatPreview: MESSAGE })
      const text = wrapper.find('[data-test="contact-row-open"]').text()
      expect(text.indexOf('Carla-Sonne')).toBeLessThan(text.indexOf('contacts.bookings:12'))
      expect(text.indexOf('contacts.bookings:12')).toBeLessThan(text.indexOf('Morgen um zehn'))
      expect(lines().at(-1)).toBe(lineOf().element)
    })

    // Where nothing has been booked yet, the line above says how the two became contacts.
    it('stands last under the line of how the two became contacts, too', () => {
      mountWith({
        ...CONTACT,
        bookings: 0,
        origin: 'ARRIVAL',
        homeCommunity: true,
        chatPreview: MESSAGE,
      })
      const text = wrapper.find('[data-test="contact-row-open"]').text()
      expect(text.indexOf('contacts.origin.arrival')).toBeLessThan(text.indexOf('Morgen um zehn'))
      expect(lines().at(-1)).toBe(lineOf().element)
    })

    it('is part of what the button says, inside it', () => {
      mountWith({ ...CONTACT, homeCommunity: true, chatPreview: MESSAGE })
      expect(
        wrapper.find('[data-test="contact-row-open"] [data-test="chat-preview-line"]').exists(),
      ).toBe(true)
    })

    describe('dark while a message from them waits unread', () => {
      const darkness = (contact) => {
        mountWith({ ...CONTACT, homeCommunity: true, ...contact })
        return lineOf().classes().includes('fw-semibold')
      }

      it('is dark for their message while something waits', () => {
        expect(darkness({ chatPreview: MESSAGE, unreadChatMessages: 2 })).toBe(true)
      })

      it('is quiet once nothing waits', () => {
        expect(darkness({ chatPreview: MESSAGE, unreadChatMessages: 0 })).toBe(false)
      })

      it("is quiet for one's own message, whatever waits", () => {
        expect(darkness({ chatPreview: { ...MESSAGE, mine: true }, unreadChatMessages: 2 })).toBe(
          false,
        )
      })

      it('is quiet for a booking: an amount waits for nobody', () => {
        expect(darkness({ chatPreview: { ...BOOKING, mine: false }, unreadChatMessages: 2 })).toBe(
          false,
        )
      })
    })
  })
})
