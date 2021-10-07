import { mount, RouterLinkStub } from '@vue/test-utils'
import RegisterSelectCommunity from './RegisterSelectCommunity'

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

describe('RegisterSelectCommunity', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $store: {
      state: {
        community: {
          name: 'Gradido Entwicklung',
          url: 'http://localhost/vue/',
          registerUrl: 'http://localhost/vue/register',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
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
      wrapper = Wrapper()
    })

    it('renders the Div Element "#register-select-community"', () => {
      expect(wrapper.find('div#register-select-community').exists()).toBeTruthy()
    })

    it('starts with a spinner', () => {
      expect(spinnerMock).toBeCalled()
    })

    describe('calls the apollo query', () => {
      describe('server returns data', () => {
        it('calls the API to get the data', () => {
          expect(apolloQueryMock).toBeCalled()
        })

        it('has two communities', () => {
          expect(wrapper.vm.communities).toHaveLength(2)
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
