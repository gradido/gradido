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
      expect(wrapper.find('div.userdata-card').exists()).toBeTruthy()
    })
    it('renders the SPAN Element ".b-avatar"', () => {
      expect(wrapper.find('span.b-avatar').exists()).toBeTruthy()
    })

    it('find the first letters of the firstName and lastName', () => {
      expect(wrapper.find('span.b-avatar').text()).toBe('B  B')
    })
  })
})
