import { mount, RouterLinkStub } from '@vue/test-utils'
import { communities, communityInfo } from '../../graphql/queries'
import RegisterSelectCommunity from './RegisterSelectCommunity'

const localVue = global.localVue

const spinnerHideMock = jest.fn()

const spinnerMock = jest.fn(() => {
  return {
    hide: spinnerHideMock,
  }
})

const apolloQueryMock = jest
  .fn()
  .mockResolvedValueOnce({
    data: {
      getCommunityInfo: {
        name: 'test12',
        description: 'test community 12',
        url: 'http://test12.test12/',
        registerUrl: 'http://test12.test12/vue/register',
      },
    },
  })
  .mockResolvedValue({
    data: {
      communities: [
        {
          id: 1,
          name: 'Gradido Entwicklung',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
          url: 'http://localhost/vue/',
          registerUrl: 'http://localhost/vue/register-community',
        },
        {
          id: 2,
          name: 'Gradido Staging',
          description: 'Der Testserver der Gradido-Akademie.',
          url: 'https://stage1.gradido.net/vue/',
          registerUrl: 'https://stage1.gradido.net/vue/register-community',
        },
        {
          id: 3,
          name: 'Gradido-Akademie',
          description: 'Freies Institut für Wirtschaftsbionik.',
          url: 'https://gradido.net',
          registerUrl: 'https://gdd1.gradido.com/vue/register-community',
        },
      ],
    },
  })

const toasterMock = jest.fn()
const mockStoreCommit = jest.fn()

describe('RegisterSelectCommunity', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $store: {
      commit: mockStoreCommit,
      state: {
        community: {
          name: '',
          description: '',
        },
      },
    },
    $apollo: {
      query: apolloQueryMock,
    },
    $loading: {
      show: spinnerMock,
    },
    $toasted: {
      error: toasterMock,
    },
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(RegisterSelectCommunity, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('calls the API to get the community info data', () => {
      expect(apolloQueryMock).toBeCalledWith({
        query: communityInfo,
      })
    })

    it('calls the API to get the communities data', () => {
      expect(apolloQueryMock).toBeCalledWith({
        query: communities,
        fetchPolicy: 'network-only',
      })
    })

    it('renders the Div Element "#register-select-community"', () => {
      expect(wrapper.find('div#register-select-community').exists()).toBeTruthy()
    })

    it('starts with a spinner', () => {
      expect(spinnerMock).toBeCalled()
    })

    describe('communities gives back error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({
          message: 'Failed to get communities',
        })
        wrapper = Wrapper()
      })

      it('toasts an error message', () => {
        expect(toasterMock).toBeCalledWith('Failed to get communities')
      })
    })

    describe('Community data already loaded', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mocks.$store.state.community = {
          name: 'Gradido Entwicklung',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
          url: 'http://localhost/vue/',
          registerUrl: 'http://localhost/vue/register-community',
        }
        wrapper = Wrapper()
      })

      it('does not call community info data when already filled', () => {
        expect(apolloQueryMock).not.toBeCalledWith({
          query: communityInfo,
        })
      })

      it('has a Community name', () => {
        expect(wrapper.find('.card-body b').text()).toBe('Gradido Entwicklung')
      })

      it('has a Community description', () => {
        expect(wrapper.find('.card-body p').text()).toBe(
          'Die lokale Entwicklungsumgebung von Gradido.',
        )
      })
    })

    describe('calls the apollo query', () => {
      describe('server returns data', () => {
        beforeEach(async () => {
          wrapper = Wrapper()
          await wrapper.setData({
            communities: [
              {
                id: 2,
                name: 'Gradido Staging',
                description: 'Der Testserver der Gradido-Akademie.',
                url: 'https://stage1.gradido.net/vue/',
                registerUrl: 'https://stage1.gradido.net/vue/register-community',
              },
              {
                id: 3,
                name: 'Gradido-Akademie',
                description: 'Freies Institut für Wirtschaftsbionik.',
                url: 'https://gradido.net',
                registerUrl: 'https://gdd1.gradido.com/vue/register-community',
              },
            ],
          })
        })

        it('calls the API to get the data', () => {
          expect(apolloQueryMock).toBeCalled()
        })

        it('shows two other communities', () => {
          expect(wrapper.findAll('div.bg-secondary')).toHaveLength(2)
        })

        it('hides the spinner', () => {
          expect(spinnerHideMock).toBeCalled()
        })
      })

      describe('server response is error', () => {
        beforeEach(() => {
          apolloQueryMock.mockRejectedValue({
            message: 'Wrong thing',
          })
          wrapper = Wrapper()
        })

        it('toast an error', () => {
          expect(toasterMock).toBeCalledWith('Wrong thing')
        })

        it('hides the spinner', () => {
          expect(spinnerHideMock).toBeCalled()
        })
      })
    })
  })
})
