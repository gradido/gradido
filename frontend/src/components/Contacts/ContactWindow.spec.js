// AI-GENERATED — not an architecture reference
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

describe('ContactWindow', () => {
  let wrapper

  const mountWindow = (contact = CONTACT) => {
    wrapper = mount(ContactWindow, {
      props: { modelValue: true, contact },
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          BModal: { template: '<div><slot /></div>' },
          BButton: { template: '<button><slot /></button>' },
          AppAvatar: {
            props: ['initials'],
            template: '<i data-test="avatar" :data-initials="initials" />',
          },
          // ⚠️ `label` declared as a Boolean, as the real heart declares it. Without the
          // type, Vue hands the shorthand attribute through as the empty STRING and the
          // stub reports '' -- which would read as "the word was not asked for".
          FavoriteHeart: {
            props: { member: Object, label: { type: Boolean, default: false } },
            template:
              '<i data-test="heart" :data-label="String(label)" :data-id="member.gradidoID" />',
          },
        },
      },
    })
    return wrapper
  }

  afterEach(() => {
    wrapper?.unmount()
    pushSpy.mockClear()
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

  // The heart wears its word here: in a window with two named buttons it would otherwise be
  // the only unnamed control (KF-010).
  it('gives the heart its word', () => {
    mountWindow()
    const heart = wrapper.find('[data-test="heart"]')

    expect(heart.attributes('data-label')).toBe('true')
    expect(heart.attributes('data-id')).toBe('carla-id')
  })

  it('keeps a place for the chat, visibly not yet there', () => {
    expect(mountWindow().find('[data-test="contact-window-later"]').text()).toBe(
      'contacts.chatLater',
    )
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
  it('closes from a cross that says what it is', async () => {
    mountWindow()
    const cross = wrapper.find('[data-test="contact-window-close"]')

    expect(cross.exists()).toBe(true)
    expect(cross.attributes('aria-label')).toBe('form.close')

    await cross.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})
