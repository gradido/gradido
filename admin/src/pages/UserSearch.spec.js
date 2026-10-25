import { useQuery } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import { BButton, BPagination } from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, inject, nextTick, ref } from 'vue'
import { WAY_BACK_VIEW } from '@/utils/wayBackView'
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
const { mockToastSuccess, mockT, route, mockReplace } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockT: vi.fn((key) => key), // Mock translation function
  route: { query: {} },
  mockReplace: vi.fn(),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: mockToastSuccess,
  }),
}))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ replace: mockReplace }),
}))

// Mock icon components
const mockIconComponent = {
  template: '<span>Icon</span>',
}

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

describe('UserSearch', () => {
  let wrapper

  const mountPage = (stubs = {}) =>
    mount(UserSearch, {
      global: {
        stubs: {
          UserQuery: true,
          SearchUserTable: true,
          BPagination: true,
          BButton: true,
          IBiEnvelope: mockIconComponent,
          IBiXCircle: mockIconComponent,
          ...stubs,
        },
        mocks: {
          $t: mockT,
        },
      },
    })

  beforeEach(() => {
    route.query = {}
    mockReplace.mockClear()
    viewport.value = 'unknown'
    mockToastSuccess.mockClear()
    // Mock the useQuery composable, with a copy per test: the page writes role changes into
    // the list it was handed.
    useQuery.mockReturnValue({
      result: { value: { searchUsers: structuredClone(mockSearchUsers) } },
      refetch: vi.fn(),
    })

    wrapper = mountPage()
  })

  it('renders the component', () => {
    expect(wrapper.find('.user-search').exists()).toBe(true)
  })

  it('uses correct translation keys', async () => {
    // Force a re-render
    await nextTick()

    expect(mockT).toHaveBeenCalledWith('user_search')
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
      result: { value: { searchUsers: { ...structuredClone(mockSearchUsers), userCount: 300 } } },
      refetch: vi.fn(),
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

  it('renders unconfirmed emails button', () => {
    const button = wrapper.find('.unconfirmedRegisterMails')
    expect(button.exists()).toBe(true)
  })

  it('renders deleted user search button', () => {
    const button = wrapper.find('.deletedUserSearch')
    expect(button.exists()).toBe(true)
  })

  it('handles unconfirmed register mails button click', async () => {
    const button = wrapper.find('.unconfirmedRegisterMails')
    await button.trigger('click')
    expect(useQuery().refetch).toHaveBeenCalled()
  })

  it('handles deleted user search button click', async () => {
    const button = wrapper.find('.deletedUserSearch')
    await button.trigger('click')
    expect(useQuery().refetch).toHaveBeenCalled()
  })

  describe('the filter buttons', () => {
    // The words of a button, behind its icon
    const label = (button) => button.text().replace(/^Icon\s*/, '')

    beforeEach(() => {
      wrapper = mountPage({ BButton })
    })

    it('says all addresses before a filter is set', () => {
      expect(label(wrapper.find('.unconfirmedRegisterMails'))).toBe('all_emails')
      expect(label(wrapper.find('.deletedUserSearch'))).toBe('all_emails')
    })

    it('switches to the unconfirmed addresses and back', async () => {
      const button = wrapper.find('.unconfirmedRegisterMails')
      await button.trigger('click')
      expect(label(button)).toBe('unregistered_emails')
      expect(useQuery.mock.lastCall[1].filters).toEqual({ byActivated: false, byDeleted: null })
      await button.trigger('click')
      expect(label(button)).toBe('all_emails')
    })

    it('switches to the deleted members and back', async () => {
      const button = wrapper.find('.deletedUserSearch')
      await button.trigger('click')
      expect(label(button)).toBe('deleted_user')
      expect(useQuery.mock.lastCall[1].filters).toEqual({ byActivated: null, byDeleted: true })
      await button.trigger('click')
      expect(label(button)).toBe('all_emails')
    })
  })

  describe('opened with a search in the address', () => {
    beforeEach(async () => {
      route.query = { search: 'bibi' }
      wrapper = mountPage()
      await flushPromises()
    })

    // Its first question is the search: it used to ask for everybody first and then again for
    // the search (utils/wayBackView.ts, 25.10.2026).
    it('fills the query field with it and asks for it at once', () => {
      expect(wrapper.findComponent({ name: 'UserQuery' }).props('modelValue')).toBe('bibi')
      expect(useQuery.mock.lastCall[1]).toMatchObject({ query: 'bibi' })
      expect(useQuery().refetch).not.toHaveBeenCalledWith({ query: 'bibi' })
    })

    // An entry link with a search keeps it in the address: it is a place to come to.
    it('leaves the search in the address', () => {
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

  // ⭐ Bernd, 25.10.2026: on the way back from the wallet in the app on his iPhone he came to
  // the right page, "aber nicht an der Stelle in der Liste". The admin interface loads anew
  // there, so the page names its view in the address a pin hands the wallet, and reads it back.
  describe('the way back from the wallet', () => {
    // A child of the page that asks for the view, as a pin in a row does.
    let wayBackView
    const asker = {
      name: 'SearchUserTable',
      setup() {
        wayBackView = inject(WAY_BACK_VIEW, null)
        return () => h('div', { class: 'search-user-table-stub' })
      },
    }

    it('names its search, its page and the member whose pin was pressed', async () => {
      wrapper = mountPage({ SearchUserTable: asker })
      wrapper.findComponent({ name: 'UserQuery' }).vm.$emit('update:modelValue', 'bibi')
      wrapper.findComponent({ name: 'BPagination' }).vm.$emit('update:modelValue', 3)
      await flushPromises()
      expect(wayBackView({ userId: 7 })).toBe('/user?search=bibi&page=3&member=7')
    })

    it('names the plain page where it stands at its start', () => {
      wrapper = mountPage({ SearchUserTable: asker })
      expect(wayBackView(null)).toBe('/user')
    })

    it('asks for that search at once, and takes the view out of the address', async () => {
      route.query = { search: 'bibi', page: '3', member: '7' }
      wrapper = mountPage()
      await flushPromises()
      expect(useQuery.mock.lastCall[1]).toMatchObject({ query: 'bibi', currentPage: 1 })
      expect(mockReplace).toHaveBeenCalledWith({ query: { search: 'bibi' } })
    })

    // A list of three hundred, which comes when the test hands it over.
    const listOfMany = () => ({
      searchUsers: { ...structuredClone(mockSearchUsers), userCount: 300 },
    })

    // The pager takes a page back to the first while it knows no pages, and again as it comes
    // to know them (bootstrap-vue-next, BPagination). Asked for at once, the page was lost.
    it('goes to that page once the first list has come, and the real pager keeps it', async () => {
      const result = ref(null)
      const refetch = vi.fn()
      useQuery.mockReturnValue({ result, refetch })
      route.query = { search: 'bibi', page: '3' }
      wrapper = mountPage({ BPagination })
      await flushPromises()
      expect(refetch).not.toHaveBeenCalled()

      result.value = listOfMany()
      await flushPromises()
      expect(wrapper.findComponent(BPagination).props('modelValue')).toBe(3)
      expect(refetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: 'bibi', currentPage: 3 }),
      )
    })

    describe('the member whose pin was pressed', () => {
      let row
      let scroll

      beforeEach(() => {
        row = document.createElement('tr')
        row.dataset.userId = '7'
        document.body.appendChild(row)
        scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
      })

      afterEach(() => {
        row.remove()
        scroll.mockRestore()
      })

      it('is rolled to in the list of the page of the view, once', async () => {
        const result = ref(null)
        useQuery.mockReturnValue({ result, refetch: vi.fn() })
        route.query = { search: 'bibi', page: '3', member: '7' }
        wrapper = mountPage()
        await flushPromises()

        // The first list, before the page of the view is set.
        result.value = listOfMany()
        await flushPromises()
        expect(scroll).not.toHaveBeenCalled()

        // The list of that page, and one after it.
        result.value = listOfMany()
        await flushPromises()
        expect(scroll).toHaveBeenCalledTimes(1)
        result.value = listOfMany()
        await flushPromises()
        expect(scroll).toHaveBeenCalledTimes(1)
      })

      it('is rolled to in the first list where the view names no page', async () => {
        route.query = { search: 'bibi', member: '7' }
        wrapper = mountPage()
        await flushPromises()
        expect(scroll).toHaveBeenCalledTimes(1)
      })
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
      useQuery.mockReturnValue({ result: { value: answer }, refetch: vi.fn() })
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
