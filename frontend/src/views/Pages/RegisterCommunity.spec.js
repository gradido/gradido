import { mount, RouterLinkStub } from '@vue/test-utils'
import RegisterCommunity from './RegisterCommunity'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    getCommunityInfo: {
      name: 'test12',
      description: 'test community 12',
      url: 'http://test12.test12/',
      registerUrl: 'http://test12.test12/vue/register',
    },
  },
})
const toastErrorMock = jest.fn()
const mockStoreCommit = jest.fn()

describe('RegisterCommunity', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $apollo: {
      query: apolloQueryMock,
    },
    $store: {
      commit: mockStoreCommit,
      state: {
        community: {
          name: '',
          description: '',
        },
      },
    },
    $toasted: {
      error: toastErrorMock,
    },
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(RegisterCommunity, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('commits the community info to the store', () => {
      expect(mockStoreCommit).toBeCalledWith('community', {
        name: 'test12',
        description: 'test community 12',
        url: 'http://test12.test12/',
        registerUrl: 'http://test12.test12/vue/register',
      })
    })

    it('renders the Div Element "#register-community"', () => {
      expect(wrapper.find('div#register-community').exists()).toBeTruthy()
    })

    describe('communities gives back error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({
          message: 'Failed to get communities',
        })
        wrapper = Wrapper()
      })

      it('toasts an error message', () => {
        expect(toastErrorMock).toBeCalledWith('Failed to get communities')
      })
    })

    describe('Community data already loaded', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mocks.$store.state.community = {
          name: 'Gradido Entwicklung',
          url: 'http://localhost/vue/',
          registerUrl: 'http://localhost/vue/register',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
        }
        wrapper = Wrapper()
      })

      it('has a Community name', () => {
        expect(wrapper.find('.justify-content-center h1').text()).toBe('Gradido Entwicklung')
      })

      it('has a Community description', () => {
        expect(wrapper.find('.justify-content-center p').text()).toBe(
          'Die lokale Entwicklungsumgebung von Gradido.',
        )
      })

      it('does not call community data update', () => {
        expect(apolloQueryMock).not.toBeCalled()
      })
    })

    describe('buttons and links', () => {
      it('has a button "Continue to registration?"', () => {
        expect(wrapper.findAll('a').at(0).text()).toEqual('community.continue-to-registration')
      })
      it('button links to /register when clicking "Continue to registration"', () => {
        expect(wrapper.findAll('a').at(0).props().to).toBe('/register')
      })

      it('has a button "Choose another community?"', () => {
        expect(wrapper.findAll('a').at(1).text()).toEqual('community.choose-another-community')
      })
      it('button links to /select-community when clicking "Choose another community"', () => {
        expect(wrapper.findAll('a').at(1).props().to).toBe('/select-community')
      })

      it('has a button "Back to Login?"', () => {
        expect(wrapper.findAll('a').at(2).text()).toEqual('back')
      })
      it('button links to /login when clicking "Back to Login"', () => {
        expect(wrapper.findAll('a').at(2).props().to).toBe('/login')
      })
    })
  })
})
