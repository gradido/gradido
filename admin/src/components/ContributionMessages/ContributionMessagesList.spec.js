import { mount } from '@vue/test-utils'
import ContributionMessagesList from './ContributionMessagesList'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'
import { adminListContributionMessages } from '../../graphql/adminListContributionMessages.js'
import { toastErrorSpy } from '../../../test/testSetup'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue

localVue.use(VueApollo)

const defaultData = () => {
  return {
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
          message: `DATE
---
A HISTORY message
---
AMOUNT`,
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
}

describe('ContributionMessagesList', () => {
  let wrapper

  const adminListContributionMessagessMock = jest.fn()

  mockClient.setRequestHandler(
    adminListContributionMessages,
    adminListContributionMessagessMock
      .mockRejectedValueOnce({ message: 'Auaa!' })
      .mockResolvedValue({ data: defaultData() }),
  )

  const propsData = {
    contributionId: 42,
    contributionMemo: 'test memo',
    contributionUserId: 108,
    contributionStatus: 'PENDING',
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $n: jest.fn((n) => n),
    $i18n: {
      locale: 'en',
    },
  }

  const Wrapper = () => {
    return mount(ContributionMessagesList, {
      localVue,
      mocks,
      propsData,
      apolloProvider,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    describe('server response for admin list contribution messages is error', () => {
      it('toast an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Auaa!')
      })
    })

    describe('server response is succes', () => {
      it('has a DIV .contribution-messages-list', () => {
        expect(wrapper.find('div.contribution-messages-list').exists()).toBe(true)
      })

      it('has 4 messages', () => {
        expect(wrapper.findAll('div.contribution-messages-list-item')).toHaveLength(4)
      })

      it('has a Component ContributionMessagesFormular', () => {
        expect(wrapper.findComponent({ name: 'ContributionMessagesFormular' }).exists()).toBe(true)
      })
    })

    describe('call updateStatus', () => {
      beforeEach(() => {
        wrapper.vm.updateStatus(4)
      })

      it('emits update-status', () => {
        expect(wrapper.vm.$root.$emit('update-status', 4)).toBeTruthy()
      })
    })

    describe('test reload-contribution', () => {
      beforeEach(() => {
        wrapper.vm.reloadContribution(3)
      })

      it('emits reload-contribution', () => {
        expect(wrapper.emitted('reload-contribution')).toBeTruthy()
        expect(wrapper.emitted('reload-contribution')[0]).toEqual([3])
      })
    })
  })
})
