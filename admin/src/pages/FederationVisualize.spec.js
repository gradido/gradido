import { mount } from '@vue/test-utils'
import FederationVisualize from './FederationVisualize'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'
import { allCommunities } from '@/graphql/allCommunities'
import { toastErrorSpy } from '../../test/testSetup'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue

localVue.use(VueApollo)

const mocks = {
  $t: (key) => key,
  $d: vi.fn((d) => d),
  $i18n: {
    locale: 'en',
    t: (key) => key,
  },
}

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

describe('FederationVisualize', () => {
  let wrapper
  const allCommunitiesMock = vi.fn()

  mockClient.setRequestHandler(
    allCommunities,
    allCommunitiesMock
      .mockRejectedValueOnce({ message: 'Ouch!' })
      .mockResolvedValue({ data: defaultData() }),
  )

  const Wrapper = () => {
    return mount(FederationVisualize, { localVue, mocks, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      wrapper = Wrapper()
    })

    describe('server error', () => {
      it('toast error', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch!')
      })
    })

    describe('sever success', () => {
      it('sends query to Apollo when created', () => {
        expect(allCommunitiesMock).toBeCalled()
      })

      it('has a DIV element with the class "federation-visualize"', () => {
        expect(wrapper.find('div.federation-visualize').exists()).toBe(true)
      })

      it('has a refresh button', () => {
        expect(wrapper.find('[data-test="federation-communities-refresh-btn"]').exists()).toBe(true)
      })

      it('renders 1 community list item', () => {
        expect(wrapper.findAll('.list-group-item').length).toBe(1)
      })

      describe('cklicking the refresh button', () => {
        beforeEach(async () => {
          vi.clearAllMocks()
          await wrapper.find('[data-test="federation-communities-refresh-btn"]').trigger('click')
        })

        it('calls the API', async () => {
          expect(allCommunitiesMock).toBeCalled()
        })
      })
    })
  })
})
