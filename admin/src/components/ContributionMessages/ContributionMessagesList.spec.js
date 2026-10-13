import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import ContributionMessagesList from './ContributionMessagesList.vue'
import MemberWalletLink from '../MemberWalletLink.vue'
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
          IBiGeoAltFill: true,
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
  // Behind the username in the card of the member who handed the contribution in: the pin of
  // a member who stands on the wallet's map, the arrow into the wallet's send form for every
  // other (MemberWalletLink). This spec installs no store, and neither asks for one until it
  // is pressed -- so the card is set up here as it always was.
  describe('the pin or the arrow behind the username', () => {
    const onTheMap = {
      ...defaultUser,
      alias: 'peterl',
      gradidoID: '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d',
      communityUuid: '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f',
      findableOnMap: true,
    }
    const showsMember = (user) =>
      wrapper.setProps({
        contribution: {
          id: 42,
          memo: 'test memo',
          userId: 108,
          contributionStatus: 'PENDING',
          user,
        },
      })
    const pin = () => wrapper.find('[data-test="member-map-pin"]')
    const arrow = () => wrapper.find('[data-test="member-send-arrow"]')

    it('is not there for a member who does not stand on the map', async () => {
      expect(pin().exists()).toBe(false)
      await showsMember({ ...onTheMap, findableOnMap: false })
      expect(pin().exists()).toBe(false)
    })

    // The member of this spec's own contribution was never asked whether they stand there:
    // neither the one nor the other.
    it('leaves a member alone of whom the server said nothing', () => {
      expect(pin().exists()).toBe(false)
      expect(arrow().exists()).toBe(false)
    })

    it('gives a member who does not stand on the map the arrow into the send form', async () => {
      await showsMember({ ...onTheMap, findableOnMap: false })
      expect(arrow().exists()).toBe(true)

      await showsMember(onTheMap)
      expect(arrow().exists()).toBe(false)
    })

    it('sets the arrow where the pin stands: behind the username, ahead of the HumHub profile', async () => {
      await showsMember({ ...onTheMap, findableOnMap: false })
      const card = wrapper.find('.list-group-item').html()
      const username = card.indexOf('peterl')
      const sendArrow = card.indexOf('data-test="member-send-arrow"')
      const humhub = card.indexOf('humhub-username')
      expect(username).toBeGreaterThan(-1)
      expect(sendArrow).toBeGreaterThan(username)
      expect(humhub).toBeGreaterThan(sendArrow)
    })

    it('is there for a member who does', async () => {
      await showsMember(onTheMap)
      expect(pin().exists()).toBe(true)
    })

    it('is handed the member of the contribution, named by username or else by first name', async () => {
      await showsMember(onTheMap)
      expect(wrapper.findComponent(MemberWalletLink).props()).toEqual({
        member: onTheMap,
        name: 'peterl',
      })

      await showsMember({ ...onTheMap, alias: null })
      expect(wrapper.findComponent(MemberWalletLink).props('name')).toBe('Peter')
    })

    // Behind the username, and ahead of the way to the member's HumHub profile.
    it('stands behind the username', async () => {
      await showsMember(onTheMap)
      const card = wrapper.find('.list-group-item').html()
      const username = card.indexOf('peterl')
      const mapPin = card.indexOf('data-test="member-map-pin"')
      const humhub = card.indexOf('humhub-username')
      expect(username).toBeGreaterThan(-1)
      expect(mapPin).toBeGreaterThan(username)
      expect(humhub).toBeGreaterThan(mapPin)
    })
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
