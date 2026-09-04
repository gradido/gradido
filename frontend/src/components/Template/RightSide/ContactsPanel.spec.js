// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import ContactsPanel from './ContactsPanel.vue'
import { contactsPanelState, forgetContactsPanel } from '@/composables/useContactsPanel'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { forgetFavorites, rememberFavorites } from '@/composables/useFavorites'
import { CONTACTS_PANEL_ROWS } from '@/constants'

const apolloQuery = vi.fn()

vi.mock('@/graphql/contacts.graphql', () => ({
  contactListQuery: 'contactListQuery',
  favoriteListQuery: 'favoriteListQuery',
  addFavorite: 'addFavorite',
  removeFavorite: 'removeFavorite',
}))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: apolloQuery } }),
  useMutation: () => ({ mutate: vi.fn() }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (typeof values === 'number' ? `${key}:${values}` : key),
    d: (date) => `d(${date.toISOString()})`,
  }),
}))
vi.mock('@/i18n', () => ({
  default: { global: { t: (key) => key } },
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
  lastAt: `2026-08-${String(30 - n).padStart(2, '0')}T00:00:00.000Z`,
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

const givenSearch = (word, contacts, count = contacts.length) => {
  contactsPanelState.search = word
  contactsPanelState.matches.rows = contacts
  contactsPanelState.matches.count = count
  contactsPanelState.matches.loaded = true
  contactsPanelState.matches.failed = false
}

describe('ContactsPanel', () => {
  let wrapper

  const mountPanel = () => {
    wrapper = mount(ContactsPanel, {
      global: {
        mocks: {
          $t: (key, values) => (typeof values === 'number' ? `${key}:${values}` : key),
          $d: (date) => `d(${date.toISOString()})`,
        },
        stubs: {
          RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
          BSpinner: true,
          BFormInput: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          AppAvatar: {
            props: ['initials'],
            template: '<i data-test="avatar" :data-initials="initials" />',
          },
          FavoriteHeart: { props: ['member'], template: '<i data-test="heart" />' },
          Name: {
            props: ['linkedUser', 'opens'],
            template:
              '<span data-test="name" :data-opens="String(opens)">{{ linkedUser.alias }}</span>',
          },
          ContactTiles: {
            name: 'ContactTiles',
            props: { rows: Array, withAllLink: { type: Boolean, default: false } },
            emits: ['open'],
            template:
              '<div data-test="tiles"><button v-for="row in rows" :key="row.key" data-test="tile" :data-id="row.contact.user.gradidoID" @click="$emit(\'open\', row.contact)">{{ row.alias }}</button></div>',
          },
          ContactWindow: {
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
  const rowNames = () =>
    wrapper.findAll('[data-test="contacts-panel-recent"] [data-test="name"]').map((n) => n.text())

  beforeEach(() => {
    vi.useFakeTimers()
    forgetContactsPanel()
    forgetFavorites()
    apolloQuery.mockReset()
    apolloQuery.mockResolvedValue({ data: { favoriteList: [] } })
    fetchMemberAvatars.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  it('waits before it says anything', () => {
    mountPanel()
    expect(wrapper.find('[data-test="contacts-panel-loading"]').exists()).toBe(true)
  })

  /**
   * ⛔ A failed request is not an empty list -- "no contacts yet" would tell a member with a
   * hundred of them that they have none.
   */
  it('says the list could not be loaded rather than that it is empty', async () => {
    apolloQuery.mockRejectedValue(new Error('offline'))
    mountPanel()
    await nextTick()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-panel-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="contacts-panel-empty"]').exists()).toBe(false)
  })

  /**
   * ⛔ What BAU-10a is measured by: nobody stands in the row AND in the list. The
   * favourites are lifted out of the page, and what is left is what the recent list draws
   * from.
   */
  it('shows nobody twice between the favourites row and the recent list', async () => {
    givenPage([person(1), person(2), person(3)])
    rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-2' }])
    mountPanel()
    await nextTick()

    expect(tileNames()).toEqual(['Alias2'])
    expect(rowNames()).toEqual(['Alias1', 'Alias3'])
  })

  /**
   * ⛔ Read through the composable, not the `favorite` flag the server sent with the row: a
   * heart given here has to move the person up at once, without a refetch.
   */
  it('moves somebody into the row the moment they get the heart', async () => {
    givenPage([person(1), person(2)])
    mountPanel()
    await nextTick()
    expect(tileNames()).toEqual([])

    rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-1' }])
    await nextTick()

    expect(tileNames()).toEqual(['Alias1'])
    expect(rowNames()).toEqual(['Alias2'])
  })

  it('shows no more rows than the column has room for', async () => {
    givenPage(Array.from({ length: 9 }, (unused, index) => person(index + 1)))
    mountPanel()
    await nextTick()

    expect(rowNames()).toHaveLength(CONTACTS_PANEL_ROWS)
  })

  it('counts the people the server counted, not the rows it fetched', async () => {
    givenPage([person(1), person(2)], 23)
    mountPanel()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-panel-count"]').text()).toContain('23')
  })

  /**
   * ⛔ No number while a word is being searched. The server's `count` is the number of
   * MATCHES then -- a member with 137 contacts who typed "an" was shown a count of 2 over
   * a link that leads to all 137.
   */
  it('states no number while a word is being searched', async () => {
    givenPage(
      Array.from({ length: 9 }, (unused, index) => person(index + 1)),
      137,
    )
    givenSearch('an', [person(2)], 1)
    mountPanel()
    await nextTick()

    const label = wrapper.find('[data-test="contacts-panel-count"]').text()
    expect(label).not.toContain('1')
    expect(label).not.toContain('137')
  })

  /**
   * ⛔ Two different nothings. Searching is done on the SERVER here, so an unmatched word
   * comes back as an empty page -- and used to be reported as "you have no contacts yet" to
   * a member with a hundred.
   */
  it('tells an unmatched search apart from an empty contact list', async () => {
    givenPage([person(1), person(2)], 2)
    givenSearch('zzz', [], 0)
    mountPanel()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-panel-no-match"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="contacts-panel-empty"]').exists()).toBe(false)
  })

  it('says the list is empty only when it really is', async () => {
    givenPage([], 0)
    mountPanel()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-panel-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="contacts-panel-no-match"]').exists()).toBe(false)
  })

  // The matches are one list: splitting six results into "favourites" and "the rest" says
  // nothing about where the person one is looking for is.
  it('shows the matches as one list, without a favourites row', async () => {
    givenPage([person(1), person(2)])
    rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-1' }])
    givenSearch('alias', [person(1), person(2)])
    mountPanel()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-panel-favorites"]').exists()).toBe(false)
    expect(rowNames()).toEqual(['Alias1', 'Alias2'])
  })

  /**
   * ⛔ The avatar and the heart stand OUTSIDE the button. A zoomable avatar renders its own
   * button and stops the click, and the heart renders one too: nested inside the row button
   * the face swallowed the tap meant for the window -- but only for members who had a
   * portrait, so one circle behaved two ways.
   */
  it('keeps the face and the heart out of the row button', async () => {
    givenPage([person(1)])
    mountPanel()
    await nextTick()

    const row = wrapper.find('[data-test="contacts-panel-row-id-1"]')
    expect(row.element.tagName).not.toBe('BUTTON')
    expect(row.findAll('button')).toHaveLength(1)
    expect(row.find('button [data-test="avatar"]').exists()).toBe(false)
    expect(row.find('button [data-test="heart"]').exists()).toBe(false)
  })

  it('opens the window on the person that was tapped, and the name opens none of its own', async () => {
    givenPage([person(1), person(2)])
    mountPanel()
    await nextTick()

    expect(wrapper.find('[data-test="name"]').attributes('data-opens')).toBe('false')

    await wrapper.find('[data-test="contacts-panel-open-id-2"]').trigger('click')
    await nextTick()

    const openWindow = wrapper.find('[data-test="contact-window"]')
    expect(openWindow.attributes('data-open')).toBe('true')
    expect(openWindow.attributes('data-who')).toBe('id-2')
  })

  it('opens the window from a face in the favourites row too', async () => {
    givenPage([person(1)])
    rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-1' }])
    mountPanel()
    await nextTick()

    await wrapper.find('[data-test="tile"][data-id="id-1"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[data-test="contact-window"]').attributes('data-who')).toBe('id-1')
  })

  /**
   * ⛔ The way out of every state, not only the one with rows in it.
   *
   * The link used to sit inside the content branch, so a member who typed a word nobody
   * matched was left with a search box, "0 contacts" and no route to the full list at all --
   * which is precisely the defect the phone strip was carved out to fix, left standing in
   * the column beside it.
   */
  it.each([
    ['while it is still loading', () => {}],
    ['when the list could not be loaded', () => apolloQuery.mockRejectedValue(new Error('x'))],
    ['when the member has no contacts', () => givenPage([], 0)],
    [
      'when a word matches nobody',
      () => {
        givenPage([person(1)], 1)
        givenSearch('zzz', [], 0)
      },
    ],
  ])('offers the way to the full list %s', async (unused, arrange) => {
    arrange()
    mountPanel()
    await nextTick()
    await nextTick()

    const link = wrapper.find('[data-test="contacts-panel-count"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/contacts')
  })

  /**
   * ⛔ The faces follow the HEARTS as well as the rows, and this is the guard the repair for
   * the self-waking watcher went without.
   *
   * The watcher used to read the decorated lists, which read the avatar store, which its
   * own callback wrote to -- so it woke itself. Narrowing it to the fetched rows stopped
   * that and broke the other half: `isFavorite` moved inside the callback, where Vue tracks
   * nothing, so giving a heart no longer moved anybody's portrait and a contact lifted into
   * the visible five was drawn as initials for good.
   */
  it('asks for the faces again when a heart changes who is on screen', async () => {
    givenPage(Array.from({ length: 9 }, (unused, index) => person(index + 1)))
    mountPanel()
    await nextTick()

    const before = fetchMemberAvatars.mock.calls.at(-1)[1].map((user) => user.gradidoID)
    // Five rows, no favourites: the first five people.
    expect(before).toEqual(['id-1', 'id-2', 'id-3', 'id-4', 'id-5'])

    // A heart on the first row lifts number six into the list.
    rememberFavorites([{ communityUuid: 'home', gradidoID: 'id-1' }])
    await nextTick()

    const after = fetchMemberAvatars.mock.calls.at(-1)[1].map((user) => user.gradidoID)
    expect(after).toContain('id-6')
    // ⛔ And the tiles come FIRST: the store keeps a fixed number of faces and serves the
    // list in the order it is handed, while the tiles are drawn above the rows.
    expect(after[0]).toBe('id-1')
  })

  it('lets the contact go when the window closes', async () => {
    givenPage([person(1)])
    mountPanel()
    await nextTick()
    await wrapper.find('[data-test="contacts-panel-open-id-1"]').trigger('click')
    await nextTick()

    wrapper.findComponent({ name: 'ContactWindow' }).vm.$emit('update:modelValue', false)
    await nextTick()

    expect(wrapper.find('[data-test="contact-window"]').attributes('data-who')).toBe('')
  })

  /**
   * The search goes to the SERVER: the panel holds twenty rows, and searching those twenty
   * would answer about the wrong set. Debounced, so a query does not go out per keystroke.
   */
  it('asks the server for a search, once the typing stops', async () => {
    givenPage([person(1)])
    mountPanel()
    await nextTick()
    apolloQuery.mockClear()

    await wrapper.find('[data-test="contacts-panel-search"]').setValue('car')
    expect(apolloQuery).not.toHaveBeenCalled()

    vi.advanceTimersByTime(400)
    await nextTick()

    expect(apolloQuery).toHaveBeenCalledTimes(1)
    expect(apolloQuery.mock.calls[0][0].variables.search).toBe('car')
  })

  /**
   * ⛔ The timer is cleared on unmount. A flick of the switch above throws this column away,
   * and a timer that outlived it would search for a word nobody can see any more.
   */
  it('does not search after the column has been thrown away', async () => {
    givenPage([person(1)])
    mountPanel()
    await nextTick()
    apolloQuery.mockClear()
    await wrapper.find('[data-test="contacts-panel-search"]').setValue('car')

    wrapper.unmount()
    wrapper = null
    vi.advanceTimersByTime(1000)

    expect(apolloQuery).not.toHaveBeenCalled()
  })

  // Somebody looks a person up beside /overview and walks over to /send with them on screen.
  it('starts on the word the panel was already showing', async () => {
    givenPage([person(1)])
    givenSearch('car', [person(1)])
    mountPanel()
    await nextTick()

    expect(wrapper.find('[data-test="contacts-panel-search"]').element.value).toBe('car')
  })

  /**
   * ⛔ No heading of its own. The switch standing over the column IS the heading now
   * (BAU-10b; Bernd, 03.09.2026: "anstatt der Ueberschrift eben diese beiden Buttons"), and
   * a panel that prints one as well says the same word twice, one line under the other --
   * the doubling this replaced, and it ate the top of a three-column-wide column.
   *
   * ⚠️ Measured on the KEY, not on a `.h3` class. `BCol` is stubbed to a bare `<div>` in
   * this file, so a class assertion would describe the stub rather than the panel. With
   * `$t` returning its key, a heading that came back would put the literal string
   * `rightSide.contacts` at the top of the render, and nothing else here emits it.
   */
  it('names the column for a screen reader, and only for one', async () => {
    mountPanel()
    await nextTick()
    const heading = wrapper.find('h2')

    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('rightSide.contacts')
    // Clipped, not removed: `d-none` would take it from assistive technology too.
    expect(heading.classes()).toContain('visually-hidden')
    // ⛔ And ONCE. A visible heading coming back would render the word a second time,
    // under a switch that already says it -- the doubling this replaced.
    expect(wrapper.text().split('rightSide.contacts')).toHaveLength(2)
  })
})
