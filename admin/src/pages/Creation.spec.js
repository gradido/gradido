import { mount } from '@vue/test-utils'
import Creation from './Creation.vue'

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
  $apollo: {
    query: apolloQueryMock,
  },
  $toasted: {
    error: toastErrorMock,
  },
}

describe('Creation', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Creation, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.creation', () => {
      expect(wrapper.find('div.creation').exists()).toBeTruthy()
    })

    describe('apollo returns error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({
          message: 'Ouch',
        })
        wrapper = Wrapper()
      })

      it('toasts an error message', () => {
        expect(toastErrorMock).toBeCalledWith('Ouch')
      })
    })
  })
})
