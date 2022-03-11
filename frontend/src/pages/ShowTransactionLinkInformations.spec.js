import { mount } from '@vue/test-utils'
import ShowTransactionLinkInformations from './ShowTransactionLinkInformations'

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
      $store: {
        // commit: stateCommitMock,
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

describe('ShowTransactionLinkInformations', () => {
  let wrapper

  const Wrapper = (functionN) => {
    return mount(ShowTransactionLinkInformations, functionN)
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper(createMockObject())
    })

    it('renders the component', () => {
      expect(wrapper.find('div.show-transaction-link-informations').exists()).toBeTruthy()
    })
  })
})
