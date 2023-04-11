import { mount } from '@vue/test-utils'
import FederationVisualize from './FederationVisualize'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'
import { getCommunities } from '@/graphql/getCommunities'
import { toastErrorSpy } from '../../test/testSetup'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue

localVue.use(VueApollo)

const mocks = {
  $t: (key) => key,
  $d: jest.fn((d) => d),
  $i18n: {
    locale: 'en',
    t: (key) => key,
  },
}

const defaultData = () => {
  return {
    getCommunities: [
      {
        id: 1776,
        foreign: true,
        publicKey: 'c7ca9e742421bb167b8666cb78f90b40c665b8f35db8f001988d44dbb3ce8527',
        url: 'http://localhost/api/api/2_0',
        lastAnnouncedAt: '2023-04-07T12:27:24.037Z',
        verifiedAt: null,
        lastErrorAt: null,
        createdAt: '2023-04-07T11:45:06.254Z',
        updatedAt: null,
        __typename: 'Community',
      },
      {
        id: 1775,
        foreign: true,
        publicKey: 'c7ca9e742421bb167b8666cb78f90b40c665b8f35db8f001988d44dbb3ce8527',
        url: 'http://localhost/api/api/1_1',
        lastAnnouncedAt: '2023-04-07T12:27:24.023Z',
        verifiedAt: null,
        lastErrorAt: null,
        createdAt: '2023-04-07T11:45:06.234Z',
        updatedAt: null,
        __typename: 'Community',
      },
      {
        id: 1774,
        foreign: true,
        publicKey: 'c7ca9e742421bb167b8666cb78f90b40c665b8f35db8f001988d44dbb3ce8527',
        url: 'http://localhost/api/api/1_0',
        lastAnnouncedAt: '2023-04-07T12:27:24.009Z',
        verifiedAt: null,
        lastErrorAt: null,
        createdAt: '2023-04-07T11:45:06.218Z',
        updatedAt: null,
        __typename: 'Community',
      },
    ],
  }
}

describe('FederationVisualize', () => {
  let wrapper
  const getCommunitiesMock = jest.fn()

  mockClient.setRequestHandler(
    getCommunities,
    getCommunitiesMock
      .mockRejectedValueOnce({ message: 'Ouch!' })
      .mockResolvedValue({ data: defaultData() }),
  )

  const Wrapper = () => {
    return mount(FederationVisualize, { localVue, mocks, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    describe('server error', () => {
      it('toast error', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch!')
      })
    })

    describe('sever success', () => {
      it('sends query to Apollo when created', () => {
        expect(getCommunitiesMock).toBeCalled()
      })

      it('has a DIV element with the class "federation-visualize"', () => {
        expect(wrapper.find('div.federation-visualize').exists()).toBe(true)
      })

      it('has a refresh button', () => {
        expect(wrapper.find('[data-test="federation-communities-refresh-btn"]').exists()).toBe(true)
      })

      it('renders 3 community list items', () => {
        expect(wrapper.findAll('.list-group-item').length).toBe(3)
      })

      describe('cklicking the refresh button', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.find('[data-test="federation-communities-refresh-btn"]').trigger('click')
        })

        it('calls the API', async () => {
          expect(getCommunitiesMock).toBeCalled()
        })
      })
    })
  })
})
