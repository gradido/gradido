import { mount } from '@vue/test-utils'
import UserSearch from './UserSearch.vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    searchUsers: [
      {
        firstName: 'Bibi',
        lastName: 'Bloxberg',
        email: 'bibi@bloxberg.de',
        creation: [200, 400, 600],
        emailChecked: false,
      },
    ],
  },
})

const toastErrorMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    query: apolloQueryMock,
  },
  $toasted: {
    error: toastErrorMock,
  },
  $moment: jest.fn(() => {
    return {
      format: jest.fn((m) => m),
      subtract: jest.fn(() => {
        return {
          format: jest.fn((m) => m),
        }
      }),
    }
  }),
}

describe('UserSearch', () => {
  let wrapper

  const Wrapper = () => {
    return mount(UserSearch, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.user-search', () => {
      expect(wrapper.find('div.user-search').exists()).toBeTruthy()
    })

    describe('unconfirmed emails', () => {
      beforeEach(async () => {
        await wrapper.find('button.btn-block').trigger('click')
      })

      it('filters the users by unconfirmed emails', () => {
        expect(wrapper.vm.searchResult).toHaveLength(0)
      })
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
