import { mount } from '@vue/test-utils'
import Overview from './Overview.vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    searchUsers: [
      {
        firstName: 'Bibi',
        lastName: 'Bloxberg',
        email: 'bibi@bloxberg.de',
        creation: [200, 400, 600],
      },
    ],
  },
})

const toastErrorMock = jest.fn()

const mocks = {
  $store: {
    state: {
      openCreations: 0,
    },
    commit: jest.fn(),
  },
  $apollo: {
    query: apolloQueryMock,
  },
  $toasted: {
    error: toastErrorMock,
  },
}

describe('Overview', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Overview, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.admin-overview', () => {
      expect(wrapper.find('div.admin-overview').exists()).toBeTruthy()
    })
  })
})
