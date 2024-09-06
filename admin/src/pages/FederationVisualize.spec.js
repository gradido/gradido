// import { mount } from '@vue/test-utils'
// import FederationVisualize from './FederationVisualize'
// import VueApollo from 'vue-apollo'
// import { createMockClient } from 'mock-apollo-client'
// import { allCommunities } from '@/graphql/allCommunities'
// import { toastErrorSpy } from '../../test/testSetup'
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
// const mocks = {
//   $t: (key) => key,
//   $d: jest.fn((d) => d),
//   $i18n: {
//     locale: 'en',
//     t: (key) => key,
//   },
// }
//
// const defaultData = () => {
//   return {
//     allCommunities: [
//       {
//         id: 1,
//         foreign: false,
//         url: 'http://localhost/api/',
//         publicKey: '4007170edd8d33fb009cd99ee4e87f214e7cd21b668d45540a064deb42e243c2',
//         communityUuid: '5ab0befd-b150-4f31-a631-7f3637e47b21',
//         authenticatedAt: null,
//         name: 'Gradido Test',
//         description: 'Gradido Community zum testen',
//         gmsApiKey: '<api key>',
//         creationDate: '2024-01-09T15:56:40.592Z',
//         createdAt: '2024-01-09T15:56:40.595Z',
//         updatedAt: '2024-01-16T11:17:15.000Z',
//         federatedCommunities: [
//           {
//             id: 2046,
//             apiVersion: '2_0',
//             endPoint: 'http://localhost/api/',
//             lastAnnouncedAt: null,
//             verifiedAt: null,
//             lastErrorAt: null,
//             createdAt: '2024-01-16T10:08:21.544Z',
//             updatedAt: null,
//           },
//           {
//             id: 2045,
//             apiVersion: '1_1',
//             endPoint: 'http://localhost/api/',
//             lastAnnouncedAt: null,
//             verifiedAt: null,
//             lastErrorAt: null,
//             createdAt: '2024-01-16T10:08:21.550Z',
//             updatedAt: null,
//             __typename: 'FederatedCommunity',
//           },
//           {
//             id: 2044,
//             apiVersion: '1_0',
//             endPoint: 'http://localhost/api/',
//             lastAnnouncedAt: null,
//             verifiedAt: null,
//             lastErrorAt: null,
//             createdAt: '2024-01-16T10:08:21.544Z',
//             updatedAt: null,
//             __typename: 'FederatedCommunity',
//           },
//         ],
//       },
//     ],
//   }
// }
//
// describe('FederationVisualize', () => {
//   let wrapper
//   const allCommunitiesMock = jest.fn()
//
//   mockClient.setRequestHandler(
//     allCommunities,
//     allCommunitiesMock
//       .mockRejectedValueOnce({ message: 'Ouch!' })
//       .mockResolvedValue({ data: defaultData() }),
//   )
//
//   const Wrapper = () => {
//     return mount(FederationVisualize, { localVue, mocks, apolloProvider })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       jest.clearAllMocks()
//       wrapper = Wrapper()
//     })
//
//     describe('server error', () => {
//       it('toast error', () => {
//         expect(toastErrorSpy).toBeCalledWith('Ouch!')
//       })
//     })
//
//     describe('sever success', () => {
//       it('sends query to Apollo when created', () => {
//         expect(allCommunitiesMock).toBeCalled()
//       })
//
//       it('has a DIV element with the class "federation-visualize"', () => {
//         expect(wrapper.find('div.federation-visualize').exists()).toBe(true)
//       })
//
//       it('has a refresh button', () => {
//         expect(wrapper.find('[data-test="federation-communities-refresh-btn"]').exists()).toBe(true)
//       })
//
//       it('renders 1 community list item', () => {
//         expect(wrapper.findAll('.list-group-item').length).toBe(1)
//       })
//
//       describe('cklicking the refresh button', () => {
//         beforeEach(async () => {
//           jest.clearAllMocks()
//           await wrapper.find('[data-test="federation-communities-refresh-btn"]').trigger('click')
//         })
//
//         it('calls the API', async () => {
//           expect(allCommunitiesMock).toBeCalled()
//         })
//       })
//     })
//   })
// })

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useQuery } from '@vue/apollo-composable'
import { nextTick } from 'vue'

import FederationVisualize from './FederationVisualize.vue'
import { allCommunities } from '@/graphql/allCommunities'
import { mockToastError, i18n } from '../../test/vitest.setup'
// import CommunityVisualizeItem from '@/components/Federation/CommunityVisualizeItem.vue' // Make sure the path is correct

// Mock Apollo functions
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}))

// Mock or stub the toast plugin
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: mockToastError,
  }),
}))

const defaultData = () => {
  return {
    allCommunities: [
      {
        id: 1,
        foreign: false,
        url: 'http://localhost/api/',
        publicKey: '4007170edd8d33fb009cd99ee4e87f214e7cd21b668d45540a064deb42e243c2',
        communityUuid: '5ab0befd-b150-4f31-a631-7f3637e47b21',
        authenticatedAt: null,
        name: 'Gradido Test',
        description: 'Gradido Community zum testen',
        gmsApiKey: '<api key>',
        creationDate: '2024-01-09T15:56:40.592Z',
        createdAt: '2024-01-09T15:56:40.595Z',
        updatedAt: '2024-01-16T11:17:15.000Z',
        federatedCommunities: [
          {
            id: 2046,
            apiVersion: '2_0',
            endPoint: 'http://localhost/api/',
            lastAnnouncedAt: null,
            verifiedAt: null,
            lastErrorAt: null,
            createdAt: '2024-01-16T10:08:21.544Z',
            updatedAt: null,
          },
          {
            id: 2045,
            apiVersion: '1_1',
            endPoint: 'http://localhost/api/',
            lastAnnouncedAt: null,
            verifiedAt: null,
            lastErrorAt: null,
            createdAt: '2024-01-16T10:08:21.550Z',
            updatedAt: null,
            __typename: 'FederatedCommunity',
          },
          {
            id: 2044,
            apiVersion: '1_0',
            endPoint: 'http://localhost/api/',
            lastAnnouncedAt: null,
            verifiedAt: null,
            lastErrorAt: null,
            createdAt: '2024-01-16T10:08:21.544Z',
            updatedAt: null,
            __typename: 'FederatedCommunity',
          },
        ],
      },
    ],
  }
}

i18n.global.setLocaleMessage('en', {
  ...i18n.global.getLocaleMessage('en'),
  'federation.gradidoInstances': 'Gradido Instances',
})

describe('FederationVisualize', () => {
  let wrapper

  const createWrapper = () => {
    return mount(FederationVisualize, {
      global: {
        stubs: {
          CommunityVisualizeItem: true, // Stub the CommunityVisualizeItem component
          BButton: true,
          BListGroup: true,
          BRow: true,
          BCol: true,
          BListGroupItem: true,
          IBiArrowClockwise: true,
        },
      },
      mocks: {
        $t: (key) => key,
      },
    })
  }

  describe('mount', () => {
    beforeEach(async () => {
      useQuery.mockReturnValue({
        result: { value: null }, // Initially no data
        loading: { value: true }, // Initially loading
        refetch: vi.fn(),
        error: { value: null },
      })

      wrapper = createWrapper()
      await nextTick()
    })

    describe('server error', () => {
      it('toast error', async () => {
        // Update the error prop of the mocked useQuery result
        vi.setProps(useQuery.mock.results[0].value, {
          error: { value: new Error('Ouch!') },
        })

        await nextTick()

        expect(mockToastError).toBeCalledWith('Ouch!')
      })
    })

    describe('server success', () => {
      beforeEach(async () => {
        useQuery.mockReturnValue({
          result: { value: defaultData() },
          loading: { value: false },
          refetch: vi.fn(),
          error: { value: null },
        })

        await nextTick()
      })

      it('sends query to Apollo when created', () => {
        expect(useQuery).toBeCalledWith(allCommunities, expect.any(Function), {
          fetchPolicy: 'network-only',
        })
      })

      it('has a DIV element with the class "federation-visualize"', () => {
        expect(wrapper.find('div.federation-visualize').exists()).toBe(true)
      })

      it('has a refresh button', () => {
        expect(wrapper.find('[data-test="federation-communities-refresh-btn"]').exists()).toBe(true)
      })

      it('renders 1 community list item', () => {
        expect(wrapper.findAllComponents(BListGroupItem).length).toBe(1)
      })

      describe('clicking the refresh button', () => {
        beforeEach(async () => {
          await wrapper.find('[data-test="federation-communities-refresh-btn"]').trigger('click')
        })

        it('calls the API', async () => {
          expect(useQuery).toHaveBeenCalledTimes(2) // Initial call + refresh
        })
      })
    })
  })
})
