// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import Contacts from './Contacts.vue'
import { forgetFavorites, markFavorite, rememberFavorites } from '@/composables/useFavorites'

const handlers = new Map()
const fire = (document, data) => handlers.get(document)?.result?.({ data })
// The page asks for the hearts at setup (ensureFavorites) and for faces as rows appear.
const apolloQuery = vi.fn().mockResolvedValue({ data: { favoriteList: [], memberAvatars: [] } })

vi.mock('@/graphql/contacts.graphql', () => ({
  contactListQuery: 'contactListQuery',
  favoriteListQuery: 'favoriteListQuery',
}))
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document) => {
    const handler = { result: null, error: null }
    handlers.set(document, handler)
    return {
      onResult: (callback) => {
        handler.result = callback
      },
      onError: (callback) => {
        handler.error = callback
      },
    }
  },
  useApolloClient: () => ({ client: { query: apolloQuery } }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn() }),
}))
vi.mock('@/composables/useMemberAvatars', () => ({
  fetchMemberAvatars: vi.fn(),
}))
vi.mock('@/constants', () => ({ PAGE_SIZE: 3 }))

const person = (n, extra = {}) => ({
  user: { communityUuid: 'home', gradidoID: `id-${n}`, alias: `Alias${n}`, ...extra },
  firstAt: '2026-07-01T00:00:00.000Z',
  lastAt: `2026-08-${String(30 - n).padStart(2, '0')}T00:00:00.000Z`,
  bookings: n,
  favorite: false,
})

describe('Contacts page', () => {
  let wrapper

  const mountPage = () => {
    wrapper = mount(Contacts, {
      global: {
        mocks: {
          $t: (key, values) => (typeof values === 'number' ? `${key}:${values}` : key),
          $d: (date) => String(date),
        },
        stubs: {
          BFormInput: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template:
              '<input data-test="contacts-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          BSpinner: true,
          BPagination: {
            props: ['modelValue', 'totalRows', 'perPage'],
            template: '<nav data-test="contacts-pagination" :data-total="totalRows" />',
          },
          // Emits `open` the way the real row does, so the page's half of KF-010 -- which
          // person the window is handed -- is what is measured here. The window's own
          // contents are its spec's business.
          ContactRow: {
            props: ['contact'],
            emits: ['open'],
            template:
              '<div data-test="contact-row" @click="$emit(\'open\', contact)">{{ contact.user.alias }}</div>',
          },
          // ⚠️ Stubbed, and it has to be: the real window reaches for `useRouter`, and this
          // file installs no router -- which arrives as "Need to install with `app.use`",
          // an error that says nothing about contacts.
          ContactWindow: {
            props: ['modelValue', 'contact'],
            template:
              '<div data-test="contact-window" :data-open="String(modelValue)" :data-who="contact?.user?.gradidoID ?? \'\'" />',
          },
        },
      },
    })
    return wrapper
  }

  const rowsIn = (section) =>
    wrapper.findAll(`[data-test="${section}"] [data-test="contact-row"]`).map((r) => r.text())

  beforeEach(() => {
    handlers.clear()
    forgetFavorites()
    apolloQuery.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('shows the empty state for a member without contacts', async () => {
    mountPage()
    fire('contactListQuery', { contactList: { count: 0, contacts: [] } })
    await nextTick()
    expect(wrapper.find('[data-test="contacts-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="contacts-error"]').exists()).toBe(false)
  })

  // A failed request is not an empty list: the member is told the list could not be
  // loaded, not that they have no contacts.
  it('says so when the list cannot be loaded, instead of "no contacts yet"', async () => {
    mountPage()
    handlers.get('contactListQuery')?.error?.(new Error('offline'))
    await nextTick()
    expect(wrapper.find('[data-test="contacts-error"]').text()).toBe('contacts.notReachable')
    expect(wrapper.find('[data-test="contacts-empty"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="contacts-loading"]').exists()).toBe(false)
  })

  it("asks for the hearts itself, in case the layout's request did not land", () => {
    mountPage()
    expect(apolloQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'favoriteListQuery', fetchPolicy: 'network-only' }),
    )
  })

  it('puts the favourites above all the others', async () => {
    rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-4' }])
    mountPage()
    const contacts = [1, 2, 3, 4, 5].map((n) => person(n))
    fire('contactListQuery', { contactList: { count: 5, contacts } })
    await nextTick()
    expect(rowsIn('contacts-favorites')).toEqual(['Alias4'])
    // The rest, in the order the server sent (newest first), first page only.
    expect(rowsIn('contacts-page')).toEqual(['Alias1', 'Alias2', 'Alias3'])
    expect(wrapper.find('[data-test="contacts-count"]').text()).toContain('contacts.count:4')
    expect(wrapper.find('[data-test="contacts-pagination"]').attributes('data-total')).toBe('4')
  })

  it('moves a person up as soon as they get the heart, without a refetch', async () => {
    mountPage()
    fire('contactListQuery', { contactList: { count: 2, contacts: [person(1), person(2)] } })
    await nextTick()
    expect(wrapper.find('[data-test="contacts-favorites"]').exists()).toBe(false)
    markFavorite(person(2).user, true)
    await nextTick()
    expect(rowsIn('contacts-favorites')).toEqual(['Alias2'])
    expect(rowsIn('contacts-page')).toEqual(['Alias1'])
  })

  it('searches the alias as one types, and says when nobody matches', async () => {
    mountPage()
    fire('contactListQuery', {
      contactList: { count: 3, contacts: [1, 2, 3].map((n) => person(n)) },
    })
    await nextTick()
    await wrapper.find('[data-test="contacts-search"]').setValue('alias2')
    expect(rowsIn('contacts-page')).toEqual(['Alias2'])
    expect(wrapper.find('[data-test="contacts-pagination"]').exists()).toBe(false)
    await wrapper.find('[data-test="contacts-search"]').setValue('zzz')
    expect(wrapper.find('[data-test="contacts-none-match"]').exists()).toBe(true)
  })

  /**
   * KF-010: a tap on a contact opens the window over the list, one for the whole page --
   * not one per row, and not a jump into the send form (that is one of the two ways OUT of
   * the window).
   */
  it('opens the window on the person that was tapped', async () => {
    mountPage()
    fire('contactListQuery', { contactList: { contacts: [person(1), person(2)], count: 2 } })
    await nextTick()

    expect(wrapper.findAll('[data-test="contact-window"]')).toHaveLength(1)
    expect(wrapper.find('[data-test="contact-window"]').attributes('data-open')).toBe('false')

    await wrapper.findAll('[data-test="contact-row"]')[1].trigger('click')
    await nextTick()

    const openWindow = wrapper.find('[data-test="contact-window"]')
    expect(openWindow.attributes('data-open')).toBe('true')
    expect(openWindow.attributes('data-who')).toBe('id-2')
  })

  it('asks for the faces of the rows on screen only', async () => {
    const { fetchMemberAvatars } = await import('@/composables/useMemberAvatars')
    mountPage()
    const contacts = [1, 2, 3, 4, 5].map((n) => person(n, { avatarUpdatedAt: '2026-08-01' }))
    fire('contactListQuery', { contactList: { count: 5, contacts } })
    await nextTick()
    const lastCall = fetchMemberAvatars.mock.calls.at(-1)
    expect(lastCall[1].map((m) => m.gradidoID)).toEqual(['id-1', 'id-2', 'id-3'])
  })
})
