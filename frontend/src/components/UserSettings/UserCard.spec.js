import { mount } from '@vue/test-utils'
import UserCard from './UserCard'

const localVue = global.localVue

describe('UserCard', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => String(n)),
    $store: {
      state: {
        firstName: 'Bibi',
        lastName: 'Bloxberg',
      },
    },
  }

  const Wrapper = () => {
    return mount(UserCard, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".userdata-card"', () => {
      expect(wrapper.find('.userdata-card').exists()).toBe(true)
    })
    it('renders the SPAN Element ".b-avatar"', () => {
      expect(wrapper.find('.vue-avatar--wrapper').exists()).toBe(true)
    })

    it('find the first letters of the firstName and lastName', () => {
      expect(wrapper.find('.vue-avatar--wrapper span').text()).toBe('BB')
    })
  })
})
