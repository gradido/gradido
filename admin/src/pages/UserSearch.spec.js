import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UserSearch from './UserSearch.vue'
import { useQuery } from '@vue/apollo-composable'

// Mock the composables and components
vi.mock('@vue/apollo-composable')
vi.mock('../composables/useCreationMonths', () => ({
  default: () => ({
    creationLabel: () => 'Creation Date',
  }),
}))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: vi.fn(),
  }),
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
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
  const mockT = vi.fn((key) => key) // Mock translation function

  beforeEach(() => {
    // Mock the useQuery composable, with a copy per test: the page writes role changes into
    // the list it was handed.
    useQuery.mockReturnValue({
      result: { value: { searchUsers: structuredClone(mockSearchUsers) } },
      refetch: vi.fn(),
    })

    wrapper = mount(UserSearch, {
      global: {
        stubs: {
          UserQuery: true,
          SearchUserTable: true,
          BPagination: true,
          BButton: true,
          IBiEnvelope: mockIconComponent,
          IBiXCircle: mockIconComponent,
        },
        mocks: {
          $t: mockT,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.user-search').exists()).toBe(true)
  })

  it('uses correct translation keys', async () => {
    // Force a re-render
    await wrapper.vm.$nextTick()

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

  // Measured in the built admin: without these the table reaches past the window between
  // 768 and about 880 px (a long address next to a 20-character username).
  it('lets the username break always and the address in the narrow band', () => {
    const fields = wrapper.findComponent({ name: 'SearchUserTable' }).props('fields')
    expect(fields.find((field) => field.key === 'alias').tdClass).toBe('text-break')
    expect(fields.find((field) => field.key === 'email').tdClass).toBe('user-search-narrow-break')
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
})
