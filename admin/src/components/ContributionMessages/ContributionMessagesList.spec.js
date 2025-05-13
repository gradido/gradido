import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import ContributionMessagesList from './ContributionMessagesList.vue'
import { useQuery } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import { BContainer } from 'bootstrap-vue-next'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    ref: vi.fn(actual.ref),
  }
})
vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')

const defaultData = {
  adminListContributionMessages: {
    count: 4,
    messages: [
      {
        id: 43,
        message: 'A DIALOG message',
        createdAt: new Date().toString(),
        updatedAt: null,
        type: 'DIALOG',
        userFirstName: 'Peter',
        userLastName: 'Lustig',
        userId: 1,
        isModerator: true,
      },
      {
        id: 44,
        message: 'Another DIALOG message',
        createdAt: new Date().toString(),
        updatedAt: null,
        type: 'DIALOG',
        userFirstName: 'Bibi',
        userLastName: 'Bloxberg',
        userId: 2,
        isModerator: false,
      },
      {
        id: 45,
        message: `DATE\n---\nA HISTORY message\n---\nAMOUNT`,
        createdAt: new Date().toString(),
        updatedAt: null,
        type: 'HISTORY',
        userFirstName: 'Bibi',
        userLastName: 'Bloxberg',
        userId: 2,
        isModerator: false,
      },
      {
        id: 46,
        message: 'A MODERATOR message',
        createdAt: new Date().toString(),
        updatedAt: null,
        type: 'MODERATOR',
        userFirstName: 'Peter',
        userLastName: 'Lustig',
        userId: 1,
        isModerator: true,
      },
    ],
  },
}

const defaultUser = {
  firstName: 'Peter',
  lastName: 'Lustig',
  uniqueUsername: 'peter.lustig',
  publicName: 'PeLu',
  createdAt: new Date().toString(),
  emailContact: {
    email: 'peter.lustig@example.com',
  },
}

describe('ContributionMessagesList', () => {
  let wrapper
  let mockMessages
  const mockRefetch = vi.fn()
  const mockToastError = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()

    mockMessages = ref([])
    ref.mockReturnValueOnce(mockMessages)

    useQuery.mockReturnValue({
      onResult: vi.fn((callback) => callback({ result: defaultData })),
      onError: vi.fn(),
      result: { value: defaultData },
      refetch: mockRefetch,
    })

    useAppToast.mockReturnValue({
      toastError: mockToastError,
    })

    wrapper = mount(ContributionMessagesList, {
      props: {
        contribution: {
          id: 42,
          memo: 'test memo',
          userId: 108,
          status: 'PENDING',
          user: defaultUser,
        },
        hideResubmission: true,
      },
      global: {
        components: {
          BContainer,
        },
        mocks: {
          $t: (key) => key,
          $d: (date) => date,
          $n: (number) => number,
        },
        stubs: {
          'contribution-messages-list-item': true,
          'contribution-messages-formular': true,
        },
      },
    })

    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('renders the component', () => {
    expect(wrapper.find('.contribution-messages-list').exists()).toBe(true)
  })

  it('renders the correct number of messages', async () => {
    wrapper.vm.messages = defaultData.adminListContributionMessages.messages
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('contribution-messages-list-item-stub')).toHaveLength(4)
  })

  it('renders the ContributionMessagesFormular when status is PENDING', () => {
    expect(wrapper.find('contribution-messages-formular-stub').exists()).toBe(true)
  })

  it('does not render the ContributionMessagesFormular when status is not PENDING or IN_PROGRESS', async () => {
    await wrapper.setProps({
      contribution: {
        status: 'COMPLETED',
        user: defaultUser,
      },
    })
    expect(wrapper.find('contribution-messages-formular-stub').exists()).toBe(false)
  })

  it('updates messages when result changes', async () => {
    const newMessages = [{ id: 1, message: 'New message' }]
    mockMessages.value = newMessages
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('contribution-messages-list-item-stub')).toHaveLength(1)
  })

  it('emits update-status event', async () => {
    await wrapper.vm.updateStatus(4)
    expect(wrapper.emitted('update-status')).toBeTruthy()
    expect(wrapper.emitted('update-status')[0]).toEqual([4])
  })

  it('emits reload-contribution event', async () => {
    await wrapper.vm.reloadContribution(3)
    expect(wrapper.emitted('reload-contribution')).toBeTruthy()
    expect(wrapper.emitted('reload-contribution')[0]).toEqual([3])
  })

  it('emits update-contributions event', async () => {
    await wrapper.vm.updateContributions()
    expect(wrapper.emitted('update-contributions')).toBeTruthy()
  })
})
