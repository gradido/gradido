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
})
