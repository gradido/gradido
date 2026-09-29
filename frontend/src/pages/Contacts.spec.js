// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BPagination } from 'bootstrap-vue-next'
import Contacts from './Contacts.vue'
import { forgetFavorites, markFavorite, rememberFavorites } from '@/composables/useFavorites'
import { refreshContactsPanel } from '@/composables/useContactsPanel'

const handlers = new Map()
const fire = (document, data) => handlers.get(document)?.result?.({ data })
/**
 * The client's own questions, by the document they ask: a test sets what `contactByMemberQuery`
 * (the lookup behind `?with=`) and `contactListQuery` (the list asked again) answer. Everything
 * else -- the hearts at setup, the faces as rows appear -- gets an empty answer.
 */
const answers = new Map()
const apolloQuery = vi.fn(async (options) =>
  answers.has(options.query)
    ? answers.get(options.query)(options)
    : { data: { favoriteList: [], memberAvatars: [] } },
)

/** The address the page is opened with, and where it sends the cleaned one. */
const { route, routerReplace, toastError } = vi.hoisted(() => ({
  route: { query: {} },
  routerReplace: vi.fn(),
  toastError: vi.fn(),
}))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ replace: routerReplace }),
}))

vi.mock('@/graphql/contacts.graphql', () => ({
  contactListQuery: 'contactListQuery',
  favoriteListQuery: 'favoriteListQuery',
  contactByMemberQuery: 'contactByMemberQuery',
}))
vi.mock('@/graphql/chatGroups.graphql', () => ({
  chatGroupsQuery: 'chatGroupsQuery',
}))
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document, variables, options) => {
    const handler = { result: null, error: null, options }
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
  useAppToast: () => ({ toastError }),
}))
vi.mock('@/composables/useMemberAvatars', () => ({
  fetchMemberAvatars: vi.fn(),
}))
// The real constants, one page size smaller: the page reaches `LG_BREAKPOINT_PX` through
// `usePagerFit` -> `useViewport`, and a mock without it fails the whole file at import.
vi.mock('@/constants', async (importOriginal) => ({ ...(await importOriginal()), PAGE_SIZE: 3 }))

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
          // ⛔ Needed since the empty state offers a way out: without it the link inside
          // ContactsEmpty resolves to nothing and a test would measure its absence as a
          // decision.
          RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          BFormInput: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template:
              '<input data-test="contacts-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          BSpinner: true,
          BPagination: {
            // `noEllipsis` is carried through: it is what makes the pager fit the narrowed
            // page, so it has to be visible to a test.
            //
            // ⛔ A stub answers to whatever prop name it is handed, which is exactly how the
            // wrong one got this far -- see the test at the foot of this file, which asks
            // the REAL component instead.
            props: ['modelValue', 'totalRows', 'perPage', 'noEllipsis', 'limit'],
            template:
              '<nav data-test="contacts-pagination" :data-total="totalRows" :data-no-ellipsis="noEllipsis" :data-limit="limit" />',
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
          // Emits `created` as the real dialog does once a group is opened.
          ChatGroupCreate: {
            name: 'ChatGroupCreate',
            props: ['modelValue', 'contacts'],
            emits: ['update:modelValue', 'created'],
            template:
              '<div data-test="chat-group-create" :data-open="String(modelValue)" :data-contacts="contacts.length" />',
          },
          // Emits `open` as the real row does; its own drawing is its spec's business.
          ChatGroupRow: {
            props: ['group'],
            emits: ['open'],
            template:
              '<div data-test="chat-group-row" @click="$emit(\'open\', group)">{{ group.title }}</div>',
          },
          // The group's window, as the contact window below: its contents are its own spec's.
          ChatGroupWindow: {
            name: 'ChatGroupWindow',
            props: ['modelValue', 'group', 'contacts'],
            emits: ['update:modelValue', 'changed'],
            template:
              '<div data-test="chat-group-window" :data-open="String(modelValue)" :data-group="group?.groupUuid ?? \'\'" :data-title="group?.title ?? \'\'" @click="$emit(\'changed\')" />',
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
    answers.clear()
    route.query = {}
    routerReplace.mockClear()
    toastError.mockClear()
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
    // One quiet way out, and it leads to the page that answers an empty list (KF-016 A3).
    const link = wrapper.find('[data-test="contacts-empty-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/show-friends')
  })

  /**
   * ⚠️ This page shows the SAME sentence when a search has matched nobody -- it has always
   * done that, and it is a defect of its own. The link is kept out of that case rather than
   * made part of it: "show it to your friends" is no answer to "nobody is called that".
   */
  it('offers no way out while a search is what emptied the list', async () => {
    mountPage()
    fire('contactListQuery', { contactList: { count: 0, contacts: [] } })
    await nextTick()
    // Gegenprobe: it IS there before anything is typed.
    expect(wrapper.find('[data-test="contacts-empty-link"]').exists()).toBe(true)

    await wrapper.find('[data-test="contacts-search"]').setValue('nobody')
    fire('contactListQuery', { contactList: { count: 0, contacts: [] } })
    await nextTick()

    expect(wrapper.find('[data-test="contacts-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="contacts-empty-link"]').exists()).toBe(false)
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
    // ⛔ The two "..." are two buttons wide, and this page is now only as wide as a phone.
    // With them the pager measures 483 points and does not fit -- and it never fit a phone
    // either. Measured in a browser; what can be held here is that the page still asks for
    // them to be hidden.
    expect(wrapper.find('[data-test="contacts-pagination"]').attributes('data-no-ellipsis')).toBe(
      'true',
    )
    // ⛔ And that the page ASKS for three page numbers. The test at the foot of this file
    // proves what three does to the real component; this proves the page requests it. Both
    // are needed: removing this binding left all eleven tests here green.
    expect(wrapper.find('[data-test="contacts-pagination"]').attributes('data-limit')).toBe('3')
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

  /**
   * `/contacts?with=<gradidoID>[&community=<uuid>]` opens the conversation with that person --
   * where the mail's reply button will point (P4c).
   */
  describe('opened with the address of a conversation', () => {
    const CARLA = person(7, { gradidoID: 'carla-id', alias: 'Carla-Sonne' })
    const contactWindow = () => wrapper.find('[data-test="contact-window"]')
    const lookups = () =>
      apolloQuery.mock.calls
        .map(([options]) => options)
        .filter((o) => o.query === 'contactByMemberQuery')

    it('opens the window on the person the server knows as a contact', async () => {
      route.query = { with: 'carla-id' }
      answers.set('contactByMemberQuery', () => ({ data: { contactList: { contacts: [CARLA] } } }))
      mountPage()
      await flushPromises()

      expect(contactWindow().attributes('data-open')).toBe('true')
      expect(contactWindow().attributes('data-who')).toBe('carla-id')
      // A missing community is this one: the server reads null so.
      expect(lookups()).toEqual([
        expect.objectContaining({
          variables: { ref: { gradidoID: 'carla-id', communityUuid: null } },
          fetchPolicy: 'no-cache',
        }),
      ])
    })

    it('asks about the person in the community the address names', async () => {
      route.query = { with: 'sarah-id', community: 'provence-uuid' }
      answers.set('contactByMemberQuery', () => ({ data: { contactList: { contacts: [] } } }))
      mountPage()
      await flushPromises()

      expect(lookups()[0].variables).toEqual({
        ref: { gradidoID: 'sarah-id', communityUuid: 'provence-uuid' },
      })
    })

    // So a reload shows the list and does not open the window again; anything else stays.
    it('takes the two out of the address at once, and leaves the rest', () => {
      route.query = { with: 'carla-id', community: 'home', tab: 'x' }
      answers.set('contactByMemberQuery', () => new Promise(() => {}))
      mountPage()

      expect(routerReplace).toHaveBeenCalledTimes(1)
      expect(routerReplace).toHaveBeenCalledWith({ query: { tab: 'x' } })
    })

    // An unknown id, or somebody one never exchanged anything with: nothing opens, nothing is
    // said, the list stands as it would.
    it('opens nothing and says nothing for somebody the server does not know', async () => {
      route.query = { with: 'nobody-id' }
      answers.set('contactByMemberQuery', () => ({ data: { contactList: { contacts: [] } } }))
      mountPage()
      fire('contactListQuery', { contactList: { count: 2, contacts: [person(1), person(2)] } })
      await flushPromises()

      expect(contactWindow().attributes('data-open')).toBe('false')
      expect(toastError).not.toHaveBeenCalled()
      expect(rowsIn('contacts-page')).toEqual(['Alias1', 'Alias2'])
      // Gegenprobe: the question WAS asked -- the silence is the answer, not a skipped lookup.
      expect(lookups()).toHaveLength(1)
    })

    it('opens nothing and says nothing where the question does not get through', async () => {
      route.query = { with: 'carla-id' }
      answers.set('contactByMemberQuery', () => Promise.reject(new Error('offline')))
      mountPage()
      await flushPromises()

      expect(contactWindow().attributes('data-open')).toBe('false')
      expect(toastError).not.toHaveBeenCalled()
    })

    it('takes no person out of an address that names two', async () => {
      route.query = { with: ['carla-id', 'sarah-id'] }
      mountPage()
      await flushPromises()

      expect(lookups()).toEqual([])
      expect(routerReplace).toHaveBeenCalledWith({ query: {} })
    })

    it('leaves an address without them alone', async () => {
      mountPage()
      await flushPromises()

      expect(routerReplace).not.toHaveBeenCalled()
      expect(lookups()).toEqual([])
    })

    // A tap on a row while the lookup is on its way wins: the member chose somebody.
    it('does not open over the person the member tapped in the meantime', async () => {
      let answer
      route.query = { with: 'carla-id' }
      answers.set(
        'contactByMemberQuery',
        () =>
          new Promise((resolve) => {
            answer = resolve
          }),
      )
      mountPage()
      fire('contactListQuery', { contactList: { count: 2, contacts: [person(1), person(2)] } })
      await nextTick()
      await wrapper.findAll('[data-test="contact-row"]')[0].trigger('click')

      answer({ data: { contactList: { contacts: [CARLA] } } })
      await flushPromises()

      expect(contactWindow().attributes('data-who')).toBe('id-1')
    })
  })

  /**
   * The list asked again whenever the column's is (useContactsPanel.refreshContactsPanel): a
   * transfer went through, or chat messages arrived. The order is the server's -- whoever wrote
   * last stands on top.
   */
  describe('when the contact list may have changed', () => {
    it('asks for its list again, quietly, and shows the new order', async () => {
      mountPage()
      fire('contactListQuery', { contactList: { count: 2, contacts: [person(1), person(2)] } })
      await nextTick()
      expect(rowsIn('contacts-page')).toEqual(['Alias1', 'Alias2'])
      answers.set('contactListQuery', () => ({
        data: { contactList: { count: 2, contacts: [person(2), person(1)] } },
      }))

      refreshContactsPanel({ query: vi.fn() })
      await flushPromises()

      expect(rowsIn('contacts-page')).toEqual(['Alias2', 'Alias1'])
      const asked = apolloQuery.mock.calls
        .map(([o]) => o)
        .find((o) => o.query === 'contactListQuery')
      expect(asked).toEqual({
        query: 'contactListQuery',
        variables: { currentPage: 1, pageSize: 1000 },
        fetchPolicy: 'network-only',
        // ⛔ Nobody did anything on this page: the session clock stays where it was.
        context: { renewSession: false },
      })
    })

    it('keeps the list on screen where the question fails', async () => {
      mountPage()
      fire('contactListQuery', { contactList: { count: 2, contacts: [person(1), person(2)] } })
      await nextTick()
      answers.set('contactListQuery', () => Promise.reject(new Error('offline')))

      refreshContactsPanel({ query: vi.fn() })
      await flushPromises()

      expect(rowsIn('contacts-page')).toEqual(['Alias1', 'Alias2'])
      expect(toastError).not.toHaveBeenCalled()
    })

    // A list that failed at first stands once a question again succeeds -- not "not reachable"
    // over rows that are there (coderabbit, PR #3980).
    it('shows the list once a question again succeeds after the first one failed', async () => {
      mountPage()
      handlers.get('contactListQuery').error(new Error('offline'))
      await nextTick()
      expect(wrapper.find('[data-test="contacts-error"]').exists()).toBe(true)
      answers.set('contactListQuery', () => ({
        data: { contactList: { count: 2, contacts: [person(1), person(2)] } },
      }))

      refreshContactsPanel({ query: vi.fn() })
      await flushPromises()

      expect(wrapper.find('[data-test="contacts-error"]').exists()).toBe(false)
      expect(rowsIn('contacts-page')).toEqual(['Alias1', 'Alias2'])
    })

    it('stops waiting when a question again answers before the first one', async () => {
      mountPage()
      expect(wrapper.find('[data-test="contacts-loading"]').exists()).toBe(true)
      answers.set('contactListQuery', () => ({
        data: { contactList: { count: 1, contacts: [person(1)] } },
      }))

      refreshContactsPanel({ query: vi.fn() })
      await flushPromises()

      expect(wrapper.find('[data-test="contacts-loading"]').exists()).toBe(false)
      expect(rowsIn('contacts-page')).toEqual(['Alias1'])
    })

    // Two on their way at once: the newer answer counts, whichever lands last.
    it('keeps the newest answer when two cross', async () => {
      mountPage()
      fire('contactListQuery', { contactList: { count: 2, contacts: [person(1), person(2)] } })
      await nextTick()
      const pending = []
      answers.set(
        'contactListQuery',
        () =>
          new Promise((resolve) => {
            pending.push(resolve)
          }),
      )
      refreshContactsPanel({ query: vi.fn() })
      refreshContactsPanel({ query: vi.fn() })

      pending[1]({ data: { contactList: { count: 2, contacts: [person(2), person(1)] } } })
      await flushPromises()
      pending[0]({ data: { contactList: { count: 2, contacts: [person(1), person(2)] } } })
      await flushPromises()

      expect(rowsIn('contacts-page')).toEqual(['Alias2', 'Alias1'])
    })

    it('stops listening when the page goes', async () => {
      mountPage()
      wrapper.unmount()
      wrapper = null

      refreshContactsPanel({ query: vi.fn() })
      await flushPromises()

      expect(apolloQuery.mock.calls.some(([o]) => o.query === 'contactListQuery')).toBe(false)
    })
  })

  /**
   * The member's chat groups (P5): a section of their own above the favourites (E-050 F1a),
   * asked with the list and again whenever the list is.
   */
  describe('the groups', () => {
    const group = (n, extra = {}) => ({
      groupUuid: `group-${n}`,
      conversationId: 40 + n,
      title: `Gruppe ${n}`,
      communityName: 'Home',
      role: 'MEMBER',
      mutedByMe: false,
      memberCount: 3,
      unreadMessages: 0,
      lastMessageAt: null,
      ...extra,
    })
    const groupRows = () =>
      wrapper
        .findAll('[data-test="contacts-groups"] [data-test="chat-group-row"]')
        .map((r) => r.text())

    it('shows them above the favourites, in the order the server sent them', async () => {
      rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-1' }])
      mountPage()
      fire('contactListQuery', { contactList: { count: 2, contacts: [person(1), person(2)] } })
      fire('chatGroupsQuery', { chatGroups: [group(2), group(1)] })
      await nextTick()

      expect(groupRows()).toEqual(['Gruppe 2', 'Gruppe 1'])
      expect(wrapper.find('[data-test="contacts-groups-count"]').text()).toBe('chatGroup.count:2')
      // Above the favourites, in the page's own order.
      const html = wrapper.html()
      expect(html.indexOf('data-test="contacts-groups"')).toBeLessThan(
        html.indexOf('data-test="contacts-favorites"'),
      )
    })

    // No variables, so one cache key for whoever signs in: never answered out of the cache.
    it('asks the server on every opening of the page', () => {
      mountPage()
      expect(handlers.get('chatGroupsQuery').options).toEqual({ fetchPolicy: 'network-only' })
    })

    // "Neue Gruppe" is the way to a first group, so the section stands without one -- once the
    // server has answered, and not before.
    it('offers a new group, and says there is none yet, where the member is in no group', async () => {
      mountPage()
      expect(wrapper.find('[data-test="contacts-groups"]').exists()).toBe(false)
      fire('contactListQuery', { contactList: { count: 1, contacts: [person(1)] } })
      fire('chatGroupsQuery', { chatGroups: [] })
      await nextTick()
      expect(wrapper.find('[data-test="groups-none"]').text()).toBe('chatGroup.none')
      expect(wrapper.find('[data-test="contacts-groups-new"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="contacts-groups-count"]').exists()).toBe(false)
    })

    describe('a new group', () => {
      const createDialog = () => wrapper.find('[data-test="chat-group-create"]')

      it('opens the dialog with the contacts the page holds', async () => {
        mountPage()
        fire('contactListQuery', { contactList: { count: 2, contacts: [person(1), person(2)] } })
        fire('chatGroupsQuery', { chatGroups: [] })
        await nextTick()
        expect(createDialog().attributes('data-open')).toBe('false')

        await wrapper.find('[data-test="contacts-groups-new"]').trigger('click')

        expect(createDialog().attributes('data-open')).toBe('true')
        expect(createDialog().attributes('data-contacts')).toBe('2')
      })

      // The new group stands in the list at once, its window opens, and the list is asked again.
      it('opens the window on the group just opened, and asks for the list again', async () => {
        mountPage()
        fire('chatGroupsQuery', { chatGroups: [group(1)] })
        await nextTick()
        answers.set('chatGroupsQuery', () => ({ data: { chatGroups: [group(9), group(1)] } }))

        await wrapper.findComponent({ name: 'ChatGroupCreate' }).vm.$emit('created', group(9))
        await nextTick()

        expect(groupRows()[0]).toBe('Gruppe 9')
        const groupWindow = wrapper.find('[data-test="chat-group-window"]')
        expect(groupWindow.attributes('data-open')).toBe('true')
        expect(groupWindow.attributes('data-group')).toBe('group-9')
        await flushPromises()
        expect(apolloQuery.mock.calls.some(([o]) => o.query === 'chatGroupsQuery')).toBe(true)
        expect(groupRows()).toEqual(['Gruppe 9', 'Gruppe 1'])
      })
    })

    // A member with no contact left can still be in a group somebody took them into.
    it('shows them also where the member has no contact', async () => {
      mountPage()
      fire('contactListQuery', { contactList: { count: 0, contacts: [] } })
      fire('chatGroupsQuery', { chatGroups: [group(1)] })
      await nextTick()
      expect(groupRows()).toEqual(['Gruppe 1'])
      expect(wrapper.find('[data-test="contacts-empty"]').exists()).toBe(true)
    })

    it('narrows them by their name as one types, and steps aside where none matches', async () => {
      mountPage()
      fire('contactListQuery', { contactList: { count: 1, contacts: [person(1)] } })
      fire('chatGroupsQuery', {
        chatGroups: [group(1, { title: 'Gradido-Café Berlin' }), group(2, { title: 'Garten' })],
      })
      await nextTick()

      await wrapper.find('[data-test="contacts-search"]').setValue('CAFÉ')
      expect(groupRows()).toEqual(['Gradido-Café Berlin'])
      expect(wrapper.find('[data-test="contacts-groups-count"]').text()).toBe('chatGroup.count:1')

      await wrapper.find('[data-test="contacts-search"]').setValue('zzz')
      expect(wrapper.find('[data-test="contacts-groups"]').exists()).toBe(false)
    })

    // A failed request is not "no groups" -- and the contacts' own failure is toasted already.
    it('says so where they cannot be loaded, without a toast of its own', async () => {
      mountPage()
      fire('contactListQuery', { contactList: { count: 1, contacts: [person(1)] } })
      handlers.get('chatGroupsQuery').error(new Error('offline'))
      await nextTick()
      expect(wrapper.find('[data-test="groups-error"]').text()).toBe('chatGroup.notReachable')
      expect(toastError).not.toHaveBeenCalled()
    })

    describe("the group's window", () => {
      const groupWindow = () => wrapper.find('[data-test="chat-group-window"]')
      const openTheSecond = async () => {
        mountPage()
        fire('chatGroupsQuery', { chatGroups: [group(1), group(2)] })
        await nextTick()
        await wrapper.findAll('[data-test="chat-group-row"]')[1].trigger('click')
      }

      // One window for the page, as for the contacts (KF-010).
      it('opens on the group that was tapped', async () => {
        await openTheSecond()
        expect(wrapper.findAll('[data-test="chat-group-window"]')).toHaveLength(1)
        expect(groupWindow().attributes('data-open')).toBe('true')
        expect(groupWindow().attributes('data-group')).toBe('group-2')
      })

      it('lets the group go when it closes', async () => {
        await openTheSecond()
        await wrapper
          .findComponent({ name: 'ChatGroupWindow' })
          .vm.$emit('update:modelValue', false)
        await nextTick()
        expect(groupWindow().attributes('data-open')).toBe('false')
        expect(groupWindow().attributes('data-group')).toBe('')
      })

      // A name changed elsewhere shows in the open window once the list is asked again.
      it('shows the newest the list has of the open group', async () => {
        await openTheSecond()
        fire('chatGroupsQuery', { chatGroups: [group(1), group(2, { title: 'Neuer Name' })] })
        await nextTick()
        expect(groupWindow().attributes('data-title')).toBe('Neuer Name')
      })

      // The member left the group, or was taken out: nothing to show a window around.
      it('closes where the list no longer holds its group', async () => {
        await openTheSecond()
        fire('chatGroupsQuery', { chatGroups: [group(1)] })
        await nextTick()
        expect(groupWindow().attributes('data-open')).toBe('false')
      })

      // The member muted the group in its window: the crossed bell comes into the row.
      it('asks for the groups again when something about the open group changed', async () => {
        await openTheSecond()
        answers.set('chatGroupsQuery', () => ({
          data: { chatGroups: [group(1), group(2, { mutedByMe: true })] },
        }))
        await groupWindow().trigger('click')
        await flushPromises()
        expect(apolloQuery.mock.calls.some(([o]) => o.query === 'chatGroupsQuery')).toBe(true)
      })
    })

    describe('when the list may have changed', () => {
      it('asks for them again, quietly, and shows the new order', async () => {
        mountPage()
        fire('chatGroupsQuery', { chatGroups: [group(1), group(2)] })
        await nextTick()
        answers.set('chatGroupsQuery', () => ({ data: { chatGroups: [group(2), group(1)] } }))

        refreshContactsPanel({ query: vi.fn() })
        await flushPromises()

        expect(groupRows()).toEqual(['Gruppe 2', 'Gruppe 1'])
        const asked = apolloQuery.mock.calls
          .map(([o]) => o)
          .find((o) => o.query === 'chatGroupsQuery')
        expect(asked).toEqual({
          query: 'chatGroupsQuery',
          fetchPolicy: 'network-only',
          // ⛔ Nobody did anything on this page: the session clock stays where it was.
          context: { renewSession: false },
        })
      })

      it('keeps them on screen where the question fails', async () => {
        mountPage()
        fire('chatGroupsQuery', { chatGroups: [group(1)] })
        await nextTick()
        answers.set('chatGroupsQuery', () => Promise.reject(new Error('offline')))

        refreshContactsPanel({ query: vi.fn() })
        await flushPromises()

        expect(groupRows()).toEqual(['Gruppe 1'])
        expect(wrapper.find('[data-test="groups-error"]').exists()).toBe(false)
      })

      it('shows them once a question again succeeds after the first one failed', async () => {
        mountPage()
        handlers.get('chatGroupsQuery').error(new Error('offline'))
        await nextTick()
        expect(wrapper.find('[data-test="groups-error"]').exists()).toBe(true)
        answers.set('chatGroupsQuery', () => ({ data: { chatGroups: [group(1)] } }))

        refreshContactsPanel({ query: vi.fn() })
        await flushPromises()

        expect(wrapper.find('[data-test="groups-error"]').exists()).toBe(false)
        expect(groupRows()).toEqual(['Gruppe 1'])
      })

      // ⚠️ With no group in the answer: rows would cover a failure left standing, an empty list
      // does not -- "could not be loaded" over a list that loaded is the defect to catch.
      it('lets the failure go once a question answers, also where there is no group', async () => {
        mountPage()
        handlers.get('chatGroupsQuery').error(new Error('offline'))
        await nextTick()
        expect(wrapper.find('[data-test="groups-error"]').exists()).toBe(true)
        answers.set('chatGroupsQuery', () => ({ data: { chatGroups: [] } }))

        refreshContactsPanel({ query: vi.fn() })
        await flushPromises()

        expect(wrapper.find('[data-test="groups-error"]').exists()).toBe(false)
      })

      it('lets the failure go once the page query answers after all', async () => {
        mountPage()
        handlers.get('chatGroupsQuery').error(new Error('offline'))
        await nextTick()
        fire('chatGroupsQuery', { chatGroups: [] })
        await nextTick()
        expect(wrapper.find('[data-test="groups-error"]').exists()).toBe(false)
      })

      it('keeps the newest answer when two cross', async () => {
        mountPage()
        fire('chatGroupsQuery', { chatGroups: [group(1), group(2)] })
        await nextTick()
        const pending = []
        answers.set(
          'chatGroupsQuery',
          () =>
            new Promise((resolve) => {
              pending.push(resolve)
            }),
        )
        refreshContactsPanel({ query: vi.fn() })
        refreshContactsPanel({ query: vi.fn() })

        pending[1]({ data: { chatGroups: [group(2), group(1)] } })
        await flushPromises()
        pending[0]({ data: { chatGroups: [group(1), group(2)] } })
        await flushPromises()

        expect(groupRows()).toEqual(['Gruppe 2', 'Gruppe 1'])
      })

      it('stops asking when the page goes', async () => {
        mountPage()
        wrapper.unmount()
        wrapper = null

        refreshContactsPanel({ query: vi.fn() })
        await flushPromises()

        expect(apolloQuery.mock.calls.some(([o]) => o.query === 'chatGroupsQuery')).toBe(false)
      })
    })
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
  /**
   * ⛔⛔ The test above asks a STUB, and a stub answers to any prop name it is handed. This
   * one asks the real component, and it is the only reason the name is right.
   *
   * The page first shipped `hide-ellipsis` -- BootstrapVue's Vue-2 name, copied from
   * `PaginatorRouteParamsPage`, which still carries it. It does not exist in
   * bootstrap-vue-next: the string does not occur once in the installed 0.26.8 bundle, and
   * the component renders both "..." with it exactly as it does without it. The stub test
   * stayed green throughout, because the stub declared whatever the page was passing.
   *
   * ⚠️ So this asserts the EFFECT, not the name: what the page needs is a pager without
   * ellipses, whatever the library ends up calling that.
   */
  it('really loses its ellipses with the prop the page passes', () => {
    const props = { modelValue: 6, perPage: 25, totalRows: 290, pills: true, size: 'lg' }
    const without = mount(BPagination, { props })
    const withProp = mount(BPagination, { props: { ...props, noEllipsis: true } })

    // The pager has ellipses to lose -- otherwise the assertion below would hold for the
    // uninteresting reason that this page count never shows any.
    expect(without.html()).toContain('\u2026')
    expect(withProp.html()).not.toContain('\u2026')

    without.unmount()
    withProp.unmount()
  })

  /**
   * ⛔ `limit` is what keeps the pager on ONE row inside a page that is only as wide as a
   * phone, and it is the one line nothing else measures: at five page numbers the pager is
   * 540 points against this page's 450 and the last two buttons drop to a second row, which
   * is exactly what was reported. Three numbers is 421.
   *
   * ⚠️ Counted rather than measured, because jsdom does no layout -- but the count is what
   * the width follows from, and it is asserted against the REAL component, so a change in
   * how the library reads `limit` shows up here.
   */
  it('shows three page numbers, which is what keeps it on one row', () => {
    const props = { modelValue: 6, perPage: 25, totalRows: 290, pills: true, size: 'lg' }
    const five = mount(BPagination, { props: { ...props, noEllipsis: true } })
    const three = mount(BPagination, { props: { ...props, noEllipsis: true, limit: 3 } })

    const buttons = (w) => w.findAll('li').length

    // Nine buttons is the wide form the page must not have: two arrows each side and five
    // numbers. Seven is what fits.
    expect(buttons(five)).toBe(9)
    expect(buttons(three)).toBe(7)

    five.unmount()
    three.unmount()
  })

  /**
   * ⛔⛔ The whole class, not this one call site. `hide-ellipsis` is BootstrapVue's Vue-2
   * name; bootstrap-vue-next ignores it silently, so a pager carrying it looks configured
   * and is not. FOUR pagers in this wallet carried it, every one inert, and the fourth got
   * it by copying the third.
   *
   * ⚠️ This reads the files rather than mounting anything: the fault is that the prop
   * reaches no component at all, so no component's test can see it. A grep is the right
   * instrument here, and it guards the pagers nobody has written a spec for.
   */
  it('has no pager anywhere passing the prop bootstrap-vue-next ignores', () => {
    const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
    const vueFiles = []
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.vue')) vueFiles.push(full)
      }
    }
    walk(srcRoot)

    // The scan itself has to be shown to work, or an empty list would pass as "clean".
    expect(vueFiles.length).toBeGreaterThan(50)

    // ⚠️ Comments stripped first, or this file's own explanation of the dead prop -- and
    // the one beside the corrected pager -- would report themselves. A found line is not
    // yet a running line.
    const code = (file) =>
      readFileSync(file, 'utf8')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')

    // The stripping has to leave something behind, or every file would look clean.
    expect(code(join(srcRoot, 'pages/Contacts.vue'))).toContain('no-ellipsis')

    const offenders = vueFiles.filter((file) => /hide-ellipsis/.test(code(file)))
    expect(offenders).toEqual([])
  })
})
