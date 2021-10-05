import { mount } from '@vue/test-utils'
import UserCardCoinAnimation from './UserCard_CoinAnimation'

const localVue = global.localVue

const mockAPIcall = jest.fn()

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()
const storeCommitMock = jest.fn()

describe('UserCard_CoinAnimation', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        language: 'de',
      },
      commit: storeCommitMock,
    },
    $toasted: {
      success: toastSuccessMock,
      error: toastErrorMock,
    },
    $apollo: {
      query: mockAPIcall,
    },
  }

  const Wrapper = () => {
    return mount(UserCardCoinAnimation, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#formusercoinanimation').exists()).toBeTruthy()
    })

    it('has an edit BFormCheckbox switch', () => {
      expect(wrapper.find('.Test-BFormCheckbox').exists()).toBeTruthy()
    })
  })
})
