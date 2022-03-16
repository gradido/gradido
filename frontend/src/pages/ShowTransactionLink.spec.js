import { mount } from '@vue/test-utils'
import ShowTransactionLink from './ShowTransactionLink'

const localVue = global.localVue

const errorHandler = jest.fn()

localVue.config.errorHandler = errorHandler

const queryTransactionLink = jest.fn()
queryTransactionLink.mockResolvedValue('success')

const createMockObject = (code) => {
  return {
    localVue,
    mocks: {
      $t: jest.fn((t) => t),
      $i18n: {
        locale: () => 'en',
      },
      $apollo: {
        query: queryTransactionLink,
      },
      $route: {
        params: {
          code,
        },
      },
    },
  }
}

describe('ShowTransactionLink', () => {
  let wrapper

  const Wrapper = (functionN) => {
    return mount(ShowTransactionLink, functionN)
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper(createMockObject())
    })

    it('renders the component', () => {
      expect(wrapper.find('div.show-transaction-link').exists()).toBeTruthy()
    })
  })
})
