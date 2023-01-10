import { mount, RouterLinkStub } from '@vue/test-utils'
import { communities } from '@/graphql/queries'
import SelectCommunity from './SelectCommunity'

import { toastErrorSpy } from '@test/testSetup'

const localVue = global.localVue

const spinnerHideMock = jest.fn()

const spinnerMock = jest.fn(() => {
  return {
    hide: spinnerHideMock,
  }
})

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    communities: [
      {
        id: 1,
        name: 'Gradido Entwicklung',
        description: 'Die lokale Entwicklungsumgebung von Gradido.',
        url: 'http://localhost/',
        registerUrl: 'http://localhost/register-community',
      },
      {
        id: 2,
        name: 'Gradido Staging',
        description: 'Der Testserver der Gradido-Akademie.',
        url: 'https://stage1.gradido.net/',
        registerUrl: 'https://stage1.gradido.net/register-community',
      },
      {
        id: 3,
        name: 'Gradido-Akademie',
        description: 'Freies Institut für Wirtschaftsbionik.',
        url: 'https://gradido.net',
        registerUrl: 'https://gdd1.gradido.com/register-community',
      },
    ],
  },
})

const mockStoreCommit = jest.fn()

describe('SelectCommunity', () => {
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
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(SelectCommunity, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
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
        expect(toastErrorSpy).toBeCalledWith('Failed to get communities')
      })
    })

    describe('Community data already loaded', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mocks.$store.state.community = {
          name: 'Gradido Entwicklung',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
          url: 'http://localhost/',
          registerUrl: 'http://localhost/register-community',
        }
        wrapper = Wrapper()
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
                url: 'https://stage1.gradido.net/',
                registerUrl: 'https://stage1.gradido.net/register-community',
              },
              {
                id: 3,
                name: 'Gradido-Akademie',
                description: 'Freies Institut für Wirtschaftsbionik.',
                url: 'https://gradido.net',
                registerUrl: 'https://gdd1.gradido.com/register-community',
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
          expect(toastErrorSpy).toBeCalledWith('Wrong thing')
        })

        it('hides the spinner', () => {
          expect(spinnerHideMock).toBeCalled()
        })
      })
    })
  })
})
