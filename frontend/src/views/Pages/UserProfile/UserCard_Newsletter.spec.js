import { mount } from '@vue/test-utils'
import UserCardNewsletter from './UserCard_Newsletter'

const localVue = global.localVue

const mockAPIcall = jest.fn()

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()
const storeCommitMock = jest.fn()

describe('UserCard_Newsletter', () => {
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
    return mount(UserCardNewsletter, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#formusernewsletter').exists()).toBeTruthy()
    })

    it('has an edit icon', () => {
      expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
    })
  })
})
