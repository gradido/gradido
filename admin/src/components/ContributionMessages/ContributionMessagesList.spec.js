import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import ContributionMessagesList from './ContributionMessagesList.vue'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
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

// The page asks for the faces of the members it shows, once per answer. The client comes
// from the composable, and the automock above hands back undefined for it -- so it is given
// here, and the fetching itself is mocked away: what it does has its own tests.
const { mockFetchMemberAvatars } = vi.hoisted(() => ({ mockFetchMemberAvatars: vi.fn() }))
vi.mock('@/composables/useMemberAvatars', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchMemberAvatars: mockFetchMemberAvatars,
}))
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
        userAlias: 'peterl',
        userId: 1,
        userGradidoID: 'g-peter',
        userCommunityUuid: 'home',
        userAvatarUpdatedAt: '2026-09-12T04:00:00.000Z',
        isModerator: true,
      },
      {
        id: 44,
        message: 'Another DIALOG message',
        createdAt: new Date().toString(),
        updatedAt: null,
        type: 'DIALOG',
        userAlias: 'bibi',
        userId: 2,
        isModerator: false,
      },
      {
        id: 45,
        message: `DATE\n---\nA HISTORY message\n---\nAMOUNT`,
        createdAt: new Date().toString(),
        updatedAt: null,
        type: 'HISTORY',
        userAlias: 'bibi',
        userId: 2,
        isModerator: false,
      },
      {
        id: 46,
        message: 'A MODERATOR message',
        createdAt: new Date().toString(),
        updatedAt: null,
        type: 'MODERATOR',
        userAlias: 'peterl',
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
  // Alias-shaped, because that is what publicName carries since NU-024. 'PeLu' were
  // initials from the publish-name setting, and a fixture in the old shape lets a test
  // pass on a value the server cannot send any more.
  publicName: 'peterl',
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

    useApolloClient.mockReturnValue({ client: { query: vi.fn() } })
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
          contributionStatus: 'PENDING',
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
        contributionStatus: 'COMPLETED',
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
  /**
   * ⛔ ONE round trip for the whole thread, with every author in it -- not one per message.
   * A moderator who wrote three of them is one member, and the picture store keys by member.
   */
  it('asks for the faces of everybody who wrote in this thread', () => {
    expect(mockFetchMemberAvatars).toHaveBeenCalledTimes(1)
    const asked = mockFetchMemberAvatars.mock.calls[0][1]
    expect(asked[0]).toEqual({
      gradidoID: 'g-peter',
      communityUuid: 'home',
      avatarUpdatedAt: '2026-09-12T04:00:00.000Z',
    })
    expect(asked).toHaveLength(defaultData.adminListContributionMessages.messages.length)
  })
})
