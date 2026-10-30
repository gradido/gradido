import { useQuery } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import { BPagination } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from '@/utils/lastSearch'
import { adminStore } from '../../test/adminStore'
import { UserSearch } from './UserSearch'

// Mock the composables and components
vi.mock('@vue/apollo-composable')
vi.mock('../composables/useCreationMonths', () => ({
  useCreationMonths: () => ({
    creationLabel: () => 'Creation Date',
    creationMonthShorts: () => ['Aug', 'Sep', 'Oct'],
  }),
}))
// Which side of the phone boundary the window is on, set per test. jsdom has no matchMedia, so
// the real composable would answer `unknown` everywhere.
const { viewport } = await vi.hoisted(async () => {
  const { ref } = await import('vue')
  return { viewport: ref('unknown') }
})
vi.mock('@/composables/useViewport', () => ({ useViewport: () => viewport }))
const { mockToastError, mockToastSuccess, mockT, route } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockT: vi.fn((key) => key), // Mock translation function
  route: { query: {} },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT, locale: { value: 'de' } }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  }),
}))
vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

const mockSearchUsers = {
  userCount: 4,
  userList: [
    {
      userId: 4,
      firstName: 'New',
      lastName: 'User',
      email: 'new@user.ch',
      creation: [1000, 1000, 1000],
      emailChecked: false,
      role: null,
      deletedAt: null,
      findableOnMap: false,
    },
    {
      userId: 3,
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'peter@lustig.de',
      creation: [0, 0, 0],
      role: 'ADMIN',
      emailChecked: true,
      deletedAt: null,
      findableOnMap: true,
    },
    {
      userId: 2,
      firstName: 'Benjamin',
      lastName: 'Blümchen',
      email: 'benjamin@bluemchen.de',
      creation: [1000, 1000, 1000],
      role: null,
      emailChecked: true,
      deletedAt: new Date(),
      findableOnMap: false,
    },
    {
      userId: 1,
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      email: 'bibi@bloxberg.de',
      creation: [200, 400, 600],
      role: null,
      emailChecked: true,
      deletedAt: null,
      findableOnMap: true,
    },
  ],
}

// What the composable hands the page besides the answer
const noFailure = () => ({ error: { value: null }, onError: vi.fn() })

describe('UserSearch', () => {
  let wrapper

  // What the page asks the server for right now: the variables are a function of its state.
  const asked = () => useQuery.mock.lastCall[1]()

  const mountPage = (stubs = {}) =>
    mount(UserSearch, {
      global: {
        stubs: {
          UserQuery: true,
          SearchUserTable: true,
          BPagination: true,
          ...stubs,
        },
        mocks: {
          $t: mockT,
        },
        // The moderator whose last search the page keeps (utils/lastSearch.ts).
        plugins: [adminStore({ moderator: { gradidoID: 'moderator-gid' } })],
      },
    })

  beforeEach(() => {
    route.query = {}
    // No last search left behind by a test before (utils/lastSearch.ts).
    window.localStorage.clear()
    viewport.value = 'unknown'
    mockToastSuccess.mockClear()
    mockToastError.mockClear()
    // Mock the useQuery composable, with a copy per test: the page writes role changes into
    // the list it was handed.
    useQuery.mockReturnValue({
      ...noFailure(),
      result: { value: { searchUsers: structuredClone(mockSearchUsers) } },
    })

    wrapper = mountPage()
  })

  it('renders the component', () => {
    expect(wrapper.find('.user-search').exists()).toBe(true)
  })

  it('uses correct translation keys', async () => {
    // Force a re-render
    await nextTick()

    expect(mockT).toHaveBeenCalledWith('userSearch.tabs.all')
  })

  // The search finds members by username, so the table has to show the name it matched.
  it('hands the table a username column, right after the names', () => {
    const fields = wrapper.findComponent({ name: 'SearchUserTable' }).props('fields')
    expect(fields.map((field) => field.key).slice(0, 4)).toEqual([
      'email',
      'firstName',
      'lastName',
      'alias',
    ])
    expect(fields.find((field) => field.key === 'alias').label).toBe('username')
  })

  // A username may always break; the address stays whole. It broke only between 768 and 850px,
  // where the table stood until the boundary moved to 992px (AO-010): from there on it fits
  // beside the username column, measured in the built admin with a 36-character address.
  it('lets the username break always and keeps the address whole', () => {
    const fields = wrapper.findComponent({ name: 'SearchUserTable' }).props('fields')
    expect(fields.find((field) => field.key === 'alias').tdClass).toBe('text-break')
    expect(fields.find((field) => field.key === 'email')).not.toHaveProperty('tdClass')
  })

  // Below 992px every member is a card: one cell that says what the seven columns say
  // (SearchUserTable, the slot `cell(memberCard)`).
  describe('the fields on either side of the phone boundary', () => {
    const fieldKeys = () =>
      wrapper
        .findComponent({ name: 'SearchUserTable' })
        .props('fields')
        .map((field) => field.key)
    const SEVEN = ['email', 'firstName', 'lastName', 'alias', 'creation', 'createdAt', 'status']

    it('on a phone the table gets one card field', async () => {
      viewport.value = 'mobile'
      await nextTick()
      expect(fieldKeys()).toEqual(['memberCard'])
      expect(wrapper.findComponent({ name: 'SearchUserTable' }).props('fields')[0].label).toBe('')
    })

    it.each(['unknown', 'desktop'])(
      'at the desk the fields are the seven of before (%s)',
      async (side) => {
        viewport.value = side
        await nextTick()
        expect(fieldKeys()).toEqual(SEVEN)
      },
    )

    it('goes back to the seven when the window grows past the boundary', async () => {
      viewport.value = 'mobile'
      await nextTick()
      viewport.value = 'desktop'
      await nextTick()
      expect(fieldKeys()).toEqual(SEVEN)
    })
  })

  // The card names each amount of `creation` by its month; the page knows the months.
  it('hands the table the short names of the three months', () => {
    expect(wrapper.findComponent({ name: 'SearchUserTable' }).props('creationMonths')).toEqual([
      'Aug',
      'Sep',
      'Oct',
    ])
  })

  // The real pager, counted by what it draws: names of props are the library's to give.
  it('the pager shows three numbers and no end buttons on a phone, five and the end buttons at the desk', async () => {
    useQuery.mockReturnValue({
      ...noFailure(),
      result: { value: { searchUsers: { ...structuredClone(mockSearchUsers), userCount: 300 } } },
    })
    wrapper = mountPage({ BPagination })
    const pager = () => wrapper.findComponent(BPagination)
    const drawn = () =>
      pager()
        .findAll('li')
        .map((item) => item.text())

    expect(drawn()).toEqual(['«', '‹', '1', '2', '3', '4', '…', '›', '»'])

    viewport.value = 'mobile'
    await nextTick()
    expect(drawn()).toEqual(['‹', '1', '2', '3', '›'])
    // ... and all three stay in sight below 576px, where the library hides one (App.css).
    expect(pager().classes()).toContain('phone-pager')
  })

  // ⭐ Bernd, 30.10.2026: tabs as on the creation page, where the two buttons said "Alle Nutzer"
  // twice and a click on one forgot the text in the field and the page in the pager.
  describe('the status tabs', () => {
    const NOBODY_LEFT_OUT = { byActivated: null, byDeleted: null }
    const STATUS = {
      enabled: { byActivated: true, byDeleted: false },
      unconfirmed: { byActivated: false, byDeleted: false },
      deleted: { byActivated: null, byDeleted: true },
    }
    const links = () => wrapper.findAll('.page-tabs .nav-link')
    const shownWord = () => wrapper.find('.page-tabs .nav-link.active .tab-word').text()
    const pick = async (index) => {
      await links()[index].trigger('click')
      await flushPromises()
    }
    const searchField = () => wrapper.findComponent({ name: 'UserQuery' })
    const pager = () => wrapper.findComponent({ name: 'BPagination' })

    beforeEach(async () => {
      await flushPromises()
    })

    it('are four, in the words of the status column, all members first', () => {
      expect(links().map((link) => link.find('.tab-word').text())).toEqual([
        'userSearch.tabs.all',
        'userSearch.tabs.enabled',
        'userSearch.tabs.unconfirmed',
        'userSearch.tabs.deleted',
      ])
      expect(shownWord()).toBe('userSearch.tabs.all')
      expect(asked().filters).toEqual(NOBODY_LEFT_OUT)
    })

    // Each member under one tab beside "all", as the status column names them: a deleted member
    // whose address was never confirmed is deleted, and not under "unconfirmed".
    it.each([
      [1, 'enabled'],
      [2, 'unconfirmed'],
      [3, 'deleted'],
    ])('tab %i asks for what the status column calls %s', async (index, status) => {
      await pick(index)
      expect(asked().filters).toEqual(STATUS[status])
      await pick(0)
      expect(asked().filters).toEqual(NOBODY_LEFT_OUT)
    })

    it('keep the text in the field', async () => {
      searchField().vm.$emit('update:modelValue', 'bibi')
      await flushPromises()
      await pick(3)
      expect(asked()).toMatchObject({ query: 'bibi', filters: STATUS.deleted })
      expect(searchField().props('modelValue')).toBe('bibi')
    })

    it('lead to the first page of the list they show', async () => {
      pager().vm.$emit('update:modelValue', 3)
      await flushPromises()
      expect(asked().currentPage).toBe(3)
      await pick(2)
      expect(asked().currentPage).toBe(1)
      expect(pager().props('modelValue')).toBe(1)
    })

    it('leave the page alone while the moderator turns the pages', async () => {
      await pick(2)
      pager().vm.$emit('update:modelValue', 2)
      await flushPromises()
      expect(asked()).toMatchObject({ currentPage: 2, filters: STATUS.unconfirmed })
    })

    it('keep their tab when the moderator types, and the text leads to the first page too', async () => {
      await pick(1)
      pager().vm.$emit('update:modelValue', 3)
      await flushPromises()
      searchField().vm.$emit('update:modelValue', 'bibi')
      await flushPromises()
      expect(asked()).toMatchObject({ query: 'bibi', filters: STATUS.enabled, currentPage: 1 })
    })

    // `fetchPolicy` stood among the variables, where the client took it for a variable and
    // answered a tab it had seen from its cache: a member deleted since was back in the list.
    it('ask the server each time', () => {
      expect(useQuery.mock.lastCall[2]).toEqual({ fetchPolicy: 'no-cache' })
      expect(asked()).not.toHaveProperty('fetchPolicy')
    })

    // Bernd, 26.10.2026, for the creation page: "merk Dir auch den Reiter, so wie die Suche".
    describe('the tab this moderator left the page on', () => {
      it('is the one the page opens with, from the first question on', async () => {
        keepLastTab('/user', 'moderator-gid', 3)
        wrapper = mountPage()
        expect(asked().filters).toEqual(STATUS.deleted)
        await flushPromises()
        expect(shownWord()).toBe('userSearch.tabs.deleted')
        expect(asked().filters).toEqual(STATUS.deleted)
      })

      it('is kept as it changes', async () => {
        await pick(2)
        expect(lastTab('/user', 'moderator-gid', 4)).toBe(2)
        await pick(0)
        expect(lastTab('/user', 'moderator-gid', 4)).toBe(0)
      })

      it('gives way to everybody on an entry link, which looks for one member', async () => {
        keepLastTab('/user', 'moderator-gid', 3)
        route.query = { search: 'bibi' }
        wrapper = mountPage()
        expect(asked().filters).toEqual(NOBODY_LEFT_OUT)
        await flushPromises()
        expect(shownWord()).toBe('userSearch.tabs.all')
        expect(lastTab('/user', 'moderator-gid', 4)).toBe(0)
      })

      it('is kept for each moderator', () => {
        keepLastTab('/user', 'another-moderator', 3)
        wrapper = mountPage()
        expect(asked().filters).toEqual(NOBODY_LEFT_OUT)
      })
    })

    // The list's answer in words of their own, also at 0.
    describe('the number of hits', () => {
      const hits = () => wrapper.find('[data-test="user-search-hits"]')

      it('says how many the list holds, as the pager counts them', () => {
        expect(mockT).toHaveBeenCalledWith('userSearch.hits', { count: '4' }, 4)
        expect(hits().text()).toBe('userSearch.hits')
        expect(hits().attributes('role')).toBe('status')
      })

      it('groups the digits as the language of the moderator does', () => {
        useQuery.mockReturnValue({
          ...noFailure(),
          result: {
            value: { searchUsers: { ...structuredClone(mockSearchUsers), userCount: 6116 } },
          },
        })
        wrapper = mountPage()
        expect(mockT).toHaveBeenCalledWith('userSearch.hits', { count: '6.116' }, 6116)
      })

      it('says nothing before the first answer, and then what it found', async () => {
        const result = ref(null)
        useQuery.mockReturnValue({ ...noFailure(), result })
        wrapper = mountPage()
        expect(hits().text()).toBe('')
        result.value = { searchUsers: structuredClone(mockSearchUsers) }
        await flushPromises()
        expect(hits().text()).toBe('userSearch.hits')
      })

      it('says 0 where nobody is found', async () => {
        mockT.mockClear()
        useQuery.mockReturnValue({
          ...noFailure(),
          result: { value: { searchUsers: { userCount: 0, userList: [] } } },
        })
        route.query = { search: 'nobody' }
        wrapper = mountPage()
        await flushPromises()
        expect(mockT).toHaveBeenCalledWith('userSearch.hits', { count: '0' }, 0)
      })

      // The rows are still those of the list before: a number under the new tab would confirm them.
      it('says nothing where the question failed', () => {
        useQuery.mockReturnValue({
          result: { value: { searchUsers: structuredClone(mockSearchUsers) } },
          error: { value: { message: 'no answer' } },
          onError: vi.fn(),
        })
        wrapper = mountPage()
        expect(hits().text()).toBe('')
      })
    })

    it('say so where the question fails, as the creation page does', () => {
      const onError = vi.fn()
      useQuery.mockReturnValue({
        result: { value: { searchUsers: structuredClone(mockSearchUsers) } },
        error: { value: null },
        onError,
      })
      wrapper = mountPage()
      onError.mock.lastCall[0]({ message: 'no answer' })
      expect(mockToastError).toHaveBeenCalledWith('no answer')
    })

    // The real pager: it takes a page back to the number of pages it has, 0 on an empty list. A
    // page 0 is refused, and the page would not answer again until it is opened anew.
    describe('and the pages of a list that changes under them', () => {
      const answer = (userCount, userList = structuredClone(mockSearchUsers.userList)) => ({
        searchUsers: { userCount, userList },
      })
      let result
      const realPager = () => wrapper.findComponent(BPagination)

      beforeEach(async () => {
        result = ref(answer(300))
        useQuery.mockReturnValue({ ...noFailure(), result })
        wrapper = mountPage({ BPagination })
        await flushPromises()
      })

      it('never ask for a page 0: not on a page past an empty list, and not after it', async () => {
        realPager().vm.$emit('update:modelValue', 3)
        await flushPromises()
        expect(asked().currentPage).toBe(3)

        result.value = answer(0, [])
        await flushPromises()
        expect(asked().currentPage).toBe(1)

        await pick(2)
        expect(asked().currentPage).toBe(1)
        await pick(3)
        expect(asked().currentPage).toBe(1)

        result.value = answer(100)
        await flushPromises()
        expect(asked().currentPage).toBe(1)
        expect(realPager().find('.page-item.active').text()).toBe('1')
      })

      it('take a page the pager writes as 0 for the first', async () => {
        realPager().vm.$emit('update:modelValue', 0)
        await flushPromises()
        expect(asked().currentPage).toBe(1)
      })

      it('go to the last page there is where the list ends before the one asked for', async () => {
        realPager().vm.$emit('update:modelValue', 5)
        await flushPromises()
        result.value = answer(30, [])
        await flushPromises()
        expect(asked().currentPage).toBe(2)
      })

      it('leave a page alone that the list has', async () => {
        realPager().vm.$emit('update:modelValue', 2)
        await flushPromises()
        result.value = answer(26)
        await flushPromises()
        expect(asked().currentPage).toBe(2)
      })
    })
  })

  describe('opened with a search in the address', () => {
    beforeEach(async () => {
      route.query = { search: 'bibi' }
      wrapper = mountPage()
      await flushPromises()
    })

    // Its first question is the search: it used to ask for everybody first and then again.
    it('fills the query field with it and asks for it at once', () => {
      expect(wrapper.findComponent({ name: 'UserQuery' }).props('modelValue')).toBe('bibi')
      expect(asked()).toMatchObject({ query: 'bibi' })
    })
  })

  // `searchUsers` takes one text; a repeated parameter in the address is none.
  it('takes no repeated search parameter for a search', () => {
    route.query = { search: ['bibi', 'benjamin'] }
    wrapper = mountPage()
    expect(asked()).toMatchObject({ query: '' })
    expect(wrapper.findComponent({ name: 'UserQuery' }).props('modelValue')).toBe('')
  })

  // ⭐ Bernd, 26.10.2026: the page opens with the last search, kept on this device for each
  // moderator without end (utils/lastSearch.ts).
  describe('the last search', () => {
    const searchField = () => wrapper.findComponent({ name: 'UserQuery' })
    const answering = (userCount) => ({
      searchUsers: { userCount, userList: structuredClone(mockSearchUsers.userList) },
    })

    it('is the one the page opens with, however it is reached', () => {
      keepLastSearch('/user', 'moderator-gid', 'bibi@bloxberg.de')
      wrapper = mountPage()
      expect(asked()).toMatchObject({ query: 'bibi@bloxberg.de' })
      expect(searchField().props('modelValue')).toBe('bibi@bloxberg.de')
      expect(lastSearch('/user', 'moderator-gid')).toBe('bibi@bloxberg.de')
    })

    it('is kept as it changes', async () => {
      wrapper = mountPage()
      searchField().vm.$emit('update:modelValue', 'bibi@bloxberg.de')
      await flushPromises()
      expect(lastSearch('/user', 'moderator-gid')).toBe('bibi@bloxberg.de')
    })

    it('gives way to the search of an entry link, which is the last one then', () => {
      keepLastSearch('/user', 'moderator-gid', 'peter')
      route.query = { search: 'bibi' }
      wrapper = mountPage()
      expect(asked()).toMatchObject({ query: 'bibi' })
      expect(lastSearch('/user', 'moderator-gid')).toBe('bibi')
    })

    describe('where the first answer finds nobody', () => {
      beforeEach(() => {
        useQuery.mockReturnValue({ ...noFailure(), result: { value: answering(0) } })
      })

      it('gives way to everybody', async () => {
        keepLastSearch('/user', 'moderator-gid', 'bibi@bloxberg.de')
        wrapper = mountPage()
        await flushPromises()
        expect(searchField().props('modelValue')).toBe('')
        expect(asked()).toMatchObject({ query: '' })
        expect(lastSearch('/user', 'moderator-gid')).toBe('')
      })

      // Everybody, as the moderator asked: a kept tab that finds nobody is no list to open on.
      it('gives way to everybody with a kept tab as well', async () => {
        keepLastSearch('/user', 'moderator-gid', 'bibi@bloxberg.de')
        keepLastTab('/user', 'moderator-gid', 3)
        wrapper = mountPage()
        await flushPromises()
        expect(searchField().props('modelValue')).toBe('')
        expect(asked()).toMatchObject({
          query: '',
          filters: { byActivated: null, byDeleted: null },
        })
        expect(wrapper.find('.page-tabs .nav-link.active .tab-word').text()).toBe(
          'userSearch.tabs.all',
        )
        expect(lastTab('/user', 'moderator-gid', 4)).toBe(0)
      })

      // Its answer is the one about to be replaced: "0 hits" under "all" would be read out.
      it('says no number until everybody has answered', async () => {
        const result = ref(null)
        useQuery.mockReturnValue({ ...noFailure(), result })
        keepLastSearch('/user', 'moderator-gid', 'bibi@bloxberg.de')
        wrapper = mountPage()
        const hits = () => wrapper.find('[data-test="user-search-hits"]').text()

        result.value = answering(0)
        await flushPromises()
        expect(asked()).toMatchObject({ query: '' })
        expect(hits()).toBe('')

        result.value = answering(4)
        await flushPromises()
        expect(hits()).toBe('userSearch.hits')
      })

      // As it is in use: the tabs stand and show the kept one before the first answer comes.
      it('shows the tab of everybody too, where the answer comes after the page stood', async () => {
        const result = ref(null)
        useQuery.mockReturnValue({ ...noFailure(), result })
        keepLastTab('/user', 'moderator-gid', 3)
        wrapper = mountPage()
        await flushPromises()
        const shown = () => wrapper.find('.page-tabs .nav-link.active .tab-word').text()
        expect(shown()).toBe('userSearch.tabs.deleted')

        result.value = answering(0)
        await flushPromises()
        expect(shown()).toBe('userSearch.tabs.all')
      })

      it('gives way to everybody with a kept tab alone', async () => {
        keepLastTab('/user', 'moderator-gid', 2)
        wrapper = mountPage()
        await flushPromises()
        expect(asked().filters).toEqual({ byActivated: null, byDeleted: null })
        expect(lastTab('/user', 'moderator-gid', 4)).toBe(0)
      })

      it('leaves the search of an entry link alone', async () => {
        route.query = { search: 'bibi' }
        wrapper = mountPage()
        await flushPromises()
        expect(searchField().props('modelValue')).toBe('bibi')
        expect(asked()).toMatchObject({ query: 'bibi' })
      })
    })

    it('leaves a search alone that the moderator changed before the first answer came', async () => {
      const result = ref(null)
      useQuery.mockReturnValue({ ...noFailure(), result })
      keepLastSearch('/user', 'moderator-gid', 'bibi@bloxberg.de')
      wrapper = mountPage()
      searchField().vm.$emit('update:modelValue', 'nobody@example.org')
      await flushPromises()
      result.value = answering(0)
      await flushPromises()
      expect(searchField().props('modelValue')).toBe('nobody@example.org')
    })
  })

  it('hands the table the members and the pagination their count', () => {
    expect(wrapper.findComponent({ name: 'SearchUserTable' }).props('items')).toHaveLength(4)
    expect(wrapper.findComponent({ name: 'BPagination' }).props('totalRows')).toBe(4)
  })

  // SearchUserTable re-emits ChangeUserRoleFormular's `{ userId, role }` as two arguments,
  // so this page receives them positionally.
  describe('update-role from the table', () => {
    const roleOf = (userId) =>
      wrapper
        .findComponent({ name: 'SearchUserTable' })
        .props('items')
        .find((user) => user.userId === userId).role

    it('gives the member the new role', async () => {
      await wrapper
        .findComponent({ name: 'SearchUserTable' })
        .vm.$emit('update-role', 1, 'MODERATOR')
      expect(roleOf(1)).toBe('MODERATOR')
    })

    it('takes the role away with null', async () => {
      await wrapper.findComponent({ name: 'SearchUserTable' }).vm.$emit('update-role', 3, null)
      expect(roleOf(3)).toBeNull()
    })

    it('leaves the other members as they were', async () => {
      await wrapper
        .findComponent({ name: 'SearchUserTable' })
        .vm.$emit('update-role', 1, 'MODERATOR')
      expect(roleOf(3)).toBe('ADMIN')
      expect(roleOf(4)).toBeNull()
    })
  })

  // SearchUserTable re-emits DeletedUserFormular's `{ userId, deletedAt }` as two arguments.
  describe('update-deleted-at from the table', () => {
    const table = () => wrapper.findComponent({ name: 'SearchUserTable' })
    const rowOf = (userId) =>
      table()
        .props('items')
        .find((user) => user.userId === userId)
    const DELETED = '2026-10-12T11:00:00.000Z'

    it('marks the member as deleted', async () => {
      await table().vm.$emit('update-deleted-at', 1, DELETED)
      expect(rowOf(1).deletedAt).toBe(DELETED)
    })

    // The pin behind the username goes with the account (MemberWalletLink): the server gives a
    // deleted member none, and the row is not asked for again here.
    it('takes the pin off a member who was just deleted', async () => {
      expect(rowOf(1).findableOnMap).toBe(true)
      await table().vm.$emit('update-deleted-at', 1, DELETED)
      expect(rowOf(1).findableOnMap).toBe(false)
    })

    it('leaves the pins of the other members', async () => {
      await table().vm.$emit('update-deleted-at', 1, DELETED)
      expect(rowOf(3).findableOnMap).toBe(true)
      expect(rowOf(3).deletedAt).toBeNull()
    })

    // Whether a member who is brought back stands on the map only the server knows.
    it('brings a member back, without a pin until the list is asked again', async () => {
      await table().vm.$emit('update-deleted-at', 2, null)
      expect(rowOf(2).deletedAt).toBeNull()
      expect(rowOf(2).findableOnMap).toBe(false)

      await table().vm.$emit('update-deleted-at', 1, DELETED)
      await table().vm.$emit('update-deleted-at', 1, null)
      expect(rowOf(1).findableOnMap).toBe(false)
    })
  })

  // ⛔ The client freezes the answers it keeps, and hands them out as they are. The page notes a
  // new role and a deletion in the rows it shows: written to the answer itself, both threw.
  // A member deleted in their row was deleted on the server, and the page said nothing --
  // measured in the built admin interface (13.10.2026). So the page works on copies.
  describe('with the answer as the client hands it out: read-only', () => {
    const DELETED = '2026-10-13T10:00:00.000Z'
    const deepFreeze = (value) => {
      for (const part of Object.values(value)) {
        if (part && typeof part === 'object' && !Object.isFrozen(part)) {
          deepFreeze(part)
        }
      }
      return Object.freeze(value)
    }
    let answer
    const table = () => wrapper.findComponent({ name: 'SearchUserTable' })
    const rowOf = (userId) =>
      table()
        .props('items')
        .find((user) => user.userId === userId)
    const answered = (userId) => answer.searchUsers.userList.find((user) => user.userId === userId)

    beforeEach(() => {
      answer = deepFreeze({ searchUsers: structuredClone(mockSearchUsers) })
      useQuery.mockReturnValue({ ...noFailure(), result: { value: answer } })
      wrapper = mountPage()
      mockToastSuccess.mockClear()
    })

    it('proves itself: a row of the answer cannot be written to', () => {
      expect(() => {
        answered(1).deletedAt = DELETED
      }).toThrow(TypeError)
    })

    it('hands the table rows it may write to, with everything the answer says', () => {
      expect(table().props('items')).toEqual(answer.searchUsers.userList)
      expect(Object.isFrozen(rowOf(1))).toBe(false)
      expect(rowOf(1)).not.toBe(answered(1))
    })

    it('notes a deletion in its row, takes the pin off and says that the member is deleted', async () => {
      await table().vm.$emit('update-deleted-at', 1, DELETED)

      expect(rowOf(1).deletedAt).toBe(DELETED)
      expect(rowOf(1).findableOnMap).toBe(false)
      expect(mockToastSuccess).toHaveBeenCalledTimes(1)
      expect(mockToastSuccess).toHaveBeenCalledWith('user_deleted')
    })

    it('notes that a member was brought back, and says so', async () => {
      await table().vm.$emit('update-deleted-at', 2, null)

      expect(rowOf(2).deletedAt).toBeNull()
      expect(mockToastSuccess).toHaveBeenCalledTimes(1)
      expect(mockToastSuccess).toHaveBeenCalledWith('user_recovered')
    })

    it('notes a new role in its row', async () => {
      await table().vm.$emit('update-role', 1, 'MODERATOR')
      expect(rowOf(1).role).toBe('MODERATOR')
    })

    it('leaves the answer itself as the client keeps it', async () => {
      await table().vm.$emit('update-deleted-at', 1, DELETED)
      await table().vm.$emit('update-role', 1, 'MODERATOR')

      expect(answered(1).deletedAt).toBeNull()
      expect(answered(1).findableOnMap).toBe(true)
      expect(answered(1).role).toBeNull()
    })
  })
})
