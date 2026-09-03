// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import ContactsStrip from './ContactsStrip.vue'
import {
  contactsPanelState,
  forgetContactsPanel,
  searchContactsPanel,
} from '@/composables/useContactsPanel'
import { forgetFavorites, rememberFavorites } from '@/composables/useFavorites'

const apolloQuery = vi.fn()

vi.mock('@/graphql/contacts.graphql', () => ({
  contactListQuery: 'contactListQuery',
  favoriteListQuery: 'favoriteListQuery',
}))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: apolloQuery } }),
}))
vi.mock('@/composables/useMemberAvatars', () => ({
  fetchMemberAvatars: vi.fn(),
  memberAvatarProps: (user) => ({ initials: (user?.alias ?? '').slice(0, 2).toUpperCase() }),
}))

const person = (n) => ({
  user: {
    communityUuid: 'home',
    communityName: 'Gradido-Akademie',
    gradidoID: `id-${n}`,
    alias: `Alias${n}`,
  },
  firstAt: '2026-07-01T00:00:00.000Z',
  lastAt: '2026-08-30T00:00:00.000Z',
  bookings: n,
  favorite: false,
  homeCommunity: true,
})

const givenPage = (contacts, count = contacts.length) => {
  contactsPanelState.page.rows = contacts
  contactsPanelState.page.count = count
  contactsPanelState.page.loaded = true
  contactsPanelState.page.failed = false
}

describe('ContactsStrip', () => {
  let wrapper

  const mountStrip = () => {
    wrapper = mount(ContactsStrip, {
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          BSpinner: true,
          ContactTiles: {
            props: { rows: Array, withAllLink: { type: Boolean, default: false } },
            emits: ['open'],
            template:
              '<div data-test="tiles" :data-all="String(withAllLink)"><button v-for="row in rows" :key="row.key" data-test="tile" :data-id="row.contact.user.gradidoID" @click="$emit(\'open\', row.contact)">{{ row.alias }}</button></div>',
          },
          ContactWindow: {
            // ⚠️ Named, or `findComponent({ name })` cannot reach it to emit the close.
            name: 'ContactWindow',
            props: ['modelValue', 'contact'],
            template:
              '<div data-test="contact-window" :data-open="String(modelValue)" :data-who="contact?.user?.gradidoID ?? \'\'" />',
          },
        },
      },
    })
    return wrapper
  }

  const tileNames = () => wrapper.findAll('[data-test="tiles"] button').map((node) => node.text())

  beforeEach(() => {
    forgetContactsPanel()
    forgetFavorites()
    apolloQuery.mockReset()
    apolloQuery.mockResolvedValue({ data: { favoriteList: [] } })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('waits before it says anything', () => {
    mountStrip()
    expect(wrapper.find('[data-test="contacts-strip-loading"]').exists()).toBe(true)
  })

  it('says the list could not be loaded rather than that it is empty', async () => {
    apolloQuery.mockRejectedValue(new Error('offline'))
    mountStrip()
    await nextTick()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-strip-error"]').exists()).toBe(true)
  })

  it('shows the favourites as faces', async () => {
    givenPage([person(1), person(2), person(3)])
    rememberFavorites([
      { communityUuid: 'home', gradidoID: 'id-1' },
      { communityUuid: 'home', gradidoID: 'id-3' },
    ])
    mountStrip()
    await nextTick()

    expect(tileNames()).toEqual(['Alias1', 'Alias3'])
  })

  /**
   * ⛔ The state that had no counterpart while the strip was the column minus its
   * column-only parts: a member with contacts and no hearts got a completely empty box over
   * the send form -- and no route to the full list either, because the tile lived inside
   * the favourites branch.
   */
  it('says so, and still offers the way out, when there are contacts but no favourites', async () => {
    givenPage([person(1), person(2)])
    mountStrip()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-strip-empty"]').text()).toBe('contacts.noFavorites')
    expect(wrapper.find('[data-test="tiles"]').attributes('data-all')).toBe('true')
  })

  // Two different nothings: no contacts at all is not the same as no hearts given.
  it('tells a member with no contacts something else', async () => {
    givenPage([], 0)
    mountStrip()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-strip-empty"]').text()).toBe('contacts.empty')
  })

  /**
   * ⛔ The strip reads the unfiltered page and cannot be reached by the column's search box
   * at all. While both were fed from one slot, a word typed on a wide screen left the strip
   * showing a filtered handful after a rotation, with no control anywhere to clear it.
   */
  it('is untouched by a word typed in the column', async () => {
    givenPage([person(1), person(2)])
    rememberFavorites([
      { communityUuid: 'home', gradidoID: 'id-1' },
      { communityUuid: 'home', gradidoID: 'id-2' },
    ])
    mountStrip()
    await nextTick()
    expect(tileNames()).toEqual(['Alias1', 'Alias2'])

    apolloQuery.mockResolvedValue({ data: { contactList: { contacts: [person(2)], count: 1 } } })
    await searchContactsPanel({ query: apolloQuery }, 'Alias2')
    await nextTick()

    expect(tileNames()).toEqual(['Alias1', 'Alias2'])
  })

  it('opens the window on the face that was tapped', async () => {
    givenPage([person(1)])
    rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-1' }])
    mountStrip()
    await nextTick()

    await wrapper.find('[data-test="tile"][data-id="id-1"]').trigger('click')
    await nextTick()

    const openWindow = wrapper.find('[data-test="contact-window"]')
    expect(openWindow.attributes('data-open')).toBe('true')
    expect(openWindow.attributes('data-who')).toBe('id-1')
  })

  /**
   * ⛔ The contact is let go when the window closes. Without it a hidden dialog kept a
   * portrait and a person alive for the life of the page.
   */
  it('lets the contact go when the window closes', async () => {
    givenPage([person(1)])
    rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-1' }])
    mountStrip()
    await nextTick()
    await wrapper.find('[data-test="tile"][data-id="id-1"]').trigger('click')
    await nextTick()

    wrapper.findComponent({ name: 'ContactWindow' }).vm.$emit('update:modelValue', false)
    await nextTick()

    expect(wrapper.find('[data-test="contact-window"]').attributes('data-who')).toBe('')
  })
})
