import { mount } from '@vue/test-utils'
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
        name: 'test1',
        description: 'description 1',
        url: 'http://test.test/vue',
        registerUrl: 'http://localhost/vue/register-community',
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

  const Wrapper = () => {
    return mount(RegisterSelectCommunity, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element "#register-select-community"', () => {
      expect(wrapper.find('div#register-select-community').exists()).toBeTruthy()
    })

    describe('calls the apollo query', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({
          message: 'Wrong thing',
        })
        wrapper = Wrapper()
      })

      it('toast an error', () => {
        expect(toasterMock).toBeCalledWith('Wrong thing')
      })
    })
  })
})
