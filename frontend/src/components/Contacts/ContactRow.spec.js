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
  user: { communityUuid: 'home', gradidoID: 'carla', alias: 'Carla-Sonne', avatarColorIndex: 2 },
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
          Name: {
            props: ['linkedUser'],
            template: '<span data-test="name">{{ linkedUser.alias }}</span>',
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
})
