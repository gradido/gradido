// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ContactRow from './ContactRow.vue'
import { forgetAllMemberAvatars } from '@/composables/useMemberAvatars'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      typeof values === 'number'
        ? `${key}:${values}`
        : values
          ? `${key} ${JSON.stringify(values)}`
          : key,
    d: (date) => `d(${date.toISOString()})`,
  }),
}))

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

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
            props: ['initials', 'src'],
            template: '<i data-test="avatar" :data-initials="initials" />',
          },
          // Does what the real one does: appends the community, unless told not to.
          Name: {
            props: {
              linkedUser: Object,
              withCommunity: { type: Boolean, default: true },
              linked: { type: Boolean, default: true },
            },
            template:
              '<span data-test="name" :data-linked="String(linked)">{{ linkedUser.alias }}{{ withCommunity && linkedUser.communityName ? " / " + linkedUser.communityName : "" }}</span>',
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

  it('hands the member to the heart', () => {
    mountWith()
    expect(wrapper.find('[data-test="heart"]').attributes('data-id')).toBe('carla')
  })

  it('draws the face from the alias, like the booking row', () => {
    mountWith()
    expect(wrapper.find('[data-test="avatar"]').attributes('data-initials')).toBe('CA')
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
   * ⛔ And the name inside is no longer a link. The row is a button now, and a click on an
   * anchor nested in it reaches BOTH: the router navigates away while the window opens
   * behind it -- one word with two destinations. (`ContactRow.vue` and the `linked` prop
   * doc say the same thing; an earlier version of this comment claimed the window would
   * never open at all, which is not how a nested click behaves.)
   */
  it('does not let the name link away from under the button', () => {
    mountWith()
    expect(wrapper.find('[data-test="name"]').attributes('data-linked')).toBe('false')
  })
})
