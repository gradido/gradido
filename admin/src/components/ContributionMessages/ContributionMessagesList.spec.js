// import { mount } from '@vue/test-utils'
// import ContributionMessagesList from './ContributionMessagesList'
// import VueApollo from 'vue-apollo'
// import { createMockClient } from 'mock-apollo-client'
// import { adminListContributionMessages } from '../../graphql/adminListContributionMessages.js'
// import { toastErrorSpy } from '../../../test/testSetup'
//
// const mockClient = createMockClient()
// const apolloProvider = new VueApollo({
//   defaultClient: mockClient,
// })
//
// const localVue = global.localVue
//
// localVue.use(VueApollo)
//
// const defaultData = () => {
//   return {
//     adminListContributionMessages: {
//       count: 4,
//       messages: [
//         {
//           id: 43,
//           message: 'A DIALOG message',
//           createdAt: new Date().toString(),
//           updatedAt: null,
//           type: 'DIALOG',
//           userFirstName: 'Peter',
//           userLastName: 'Lustig',
//           userId: 1,
//           isModerator: true,
//         },
//         {
//           id: 44,
//           message: 'Another DIALOG message',
//           createdAt: new Date().toString(),
//           updatedAt: null,
//           type: 'DIALOG',
//           userFirstName: 'Bibi',
//           userLastName: 'Bloxberg',
//           userId: 2,
//           isModerator: false,
//         },
//         {
//           id: 45,
//           message: `DATE
// ---
// A HISTORY message
// ---
// AMOUNT`,
//           createdAt: new Date().toString(),
//           updatedAt: null,
//           type: 'HISTORY',
//           userFirstName: 'Bibi',
//           userLastName: 'Bloxberg',
//           userId: 2,
//           isModerator: false,
//         },
//         {
//           id: 46,
//           message: 'A MODERATOR message',
//           createdAt: new Date().toString(),
//           updatedAt: null,
//           type: 'MODERATOR',
//           userFirstName: 'Peter',
//           userLastName: 'Lustig',
//           userId: 1,
//           isModerator: true,
//         },
//       ],
//     },
//   }
// }
//
// describe('ContributionMessagesList', () => {
//   let wrapper
//
//   const adminListContributionMessagessMock = jest.fn()
//
//   mockClient.setRequestHandler(
//     adminListContributionMessages,
//     adminListContributionMessagessMock
//       .mockRejectedValueOnce({ message: 'Auaa!' })
//       .mockResolvedValue({ data: defaultData() }),
//   )
//
//   const propsData = {
//     contributionId: 42,
//     contributionMemo: 'test memo',
//     contributionUserId: 108,
//     contributionStatus: 'PENDING',
//     hideResubmission: true,
//   }
//
//   const mocks = {
//     $t: jest.fn((t) => t),
//     $d: jest.fn((d) => d),
//     $n: jest.fn((n) => n),
//     $i18n: {
//       locale: 'en',
//     },
//   }
//
//   const Wrapper = () => {
//     return mount(ContributionMessagesList, {
//       localVue,
//       mocks,
//       propsData,
//       apolloProvider,
//     })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       jest.clearAllMocks()
//       wrapper = Wrapper()
//     })
//
//     describe('server response for admin list contribution messages is error', () => {
//       it('toast an error message', () => {
//         expect(toastErrorSpy).toBeCalledWith('Auaa!')
//       })
//     })
//
//     describe('server response is succes', () => {
//       it('has a DIV .contribution-messages-list', () => {
//         expect(wrapper.find('div.contribution-messages-list').exists()).toBe(true)
//       })
//
//       it('has 4 messages', () => {
//         expect(wrapper.findAll('div.contribution-messages-list-item')).toHaveLength(4)
//       })
//
//       it('has a Component ContributionMessagesFormular', () => {
//         expect(wrapper.findComponent({ name: 'ContributionMessagesFormular' }).exists()).toBe(true)
//       })
//     })
//
//     describe('call updateStatus', () => {
//       beforeEach(() => {
//         wrapper.vm.updateStatus(4)
//       })
//
//       it('emits update-status', () => {
//         expect(wrapper.vm.$root.$emit('update-status', 4)).toBeTruthy()
//       })
//     })
//
//     describe('test reload-contribution', () => {
//       beforeEach(() => {
//         wrapper.vm.reloadContribution(3)
//       })
//
//       it('emits reload-contribution', () => {
//         expect(wrapper.emitted('reload-contribution')).toBeTruthy()
//         expect(wrapper.emitted('reload-contribution')[0]).toEqual([3])
//       })
//     })
//
//     describe('test update-contributions', () => {
//       beforeEach(() => {
//         wrapper.vm.updateContributions()
//       })
//
//       it('emits update-contributions', () => {
//         expect(wrapper.emitted('update-contributions')).toBeTruthy()
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContributionMessagesList from './ContributionMessagesList.vue'
import { adminListContributionMessages } from '../../graphql/adminListContributionMessages.js'
import { useAppToast } from '@/composables/useToast'
import { useQuery } from '@vue/apollo-composable'
import { BContainer } from 'bootstrap-vue-next'
import { nextTick } from 'vue'

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: vi.fn(),
  })),
}))

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

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    onResult: vi.fn(),
    onError: vi.fn(),
    result: { value: defaultData },
    refetch: vi.fn(),
  })),
}))

describe('ContributionMessagesList', () => {
  let wrapper
  const { toastError } = useAppToast()

  const createWrapper = (props = {}) => {
    return mount(ContributionMessagesList, {
      props: {
        contributionId: 42,
        contributionMemo: 'test memo',
        contributionUserId: 108,
        contributionStatus: 'PENDING',
        hideResubmission: true,
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
          $d: (d) => d,
          $n: (n) => n,
          $i18n: {
            locale: 'en',
          },
        },
        stubs: {
          BContainer,
          'contribution-messages-list-item': { template: '<span/>' },
          'contribution-messages-formular': true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  it('has a DIV .contribution-messages-list', () => {
    expect(wrapper.find('div.contribution-messages-list').exists()).toBe(true)
  })

  it('has 4 messages', async () => {
    expect(wrapper.findAll('contribution-messages-list-item-stub')).toHaveLength(4)
  })

  it('has a Component ContributionMessagesFormular', () => {
    expect(wrapper.findComponent({ name: 'contribution-messages-formular-stub' }).exists()).toBe(
      true,
    )
  })

  it('emits update-status when calling updateStatus', async () => {
    await wrapper.vm.updateStatus(4)
    expect(wrapper.emitted('update-status')).toEqual([[4]])
  })

  it('emits reload-contribution when calling reloadContribution', async () => {
    await wrapper.vm.reloadContribution(3)
    expect(wrapper.emitted('reload-contribution')).toEqual([[3]])
  })

  it('emits update-contributions when calling updateContributions', async () => {
    await wrapper.vm.updateContributions()
    expect(wrapper.emitted('update-contributions')).toBeTruthy()
  })

  it('calls toastError when there is an error', async () => {
    const error = new Error('Test error')
    const { onError } = vi.mocked(useQuery).mock.results[0].value
    onError(error)
    expect(toastError).toHaveBeenCalledWith('Test error')
  })
})
