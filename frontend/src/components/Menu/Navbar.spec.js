import { mount } from '@vue/test-utils'
import Navbar from './Navbar'

const localVue = global.localVue

const propsData = {
  balance: 1234,
  visible: false,
}

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $store: {
    state: {
      hasElopage: true,
      isAdmin: true,
    },
  },
}

describe('Navbar', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Navbar, { localVue, propsData, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.component-navbar').exists()).toBeTruthy()
    })
  })
  // describe('find link admin and evented click', () => {
  //   beforeEach(async () => {
  //     await wrapper.find('.test-admin').trigger('click')
  //   })

  //   it('find link admin and click', () => {
  //     expect(wrapper.emitted('admin')).toBeTruthy()
  //     expect(wrapper.emitted('admin')).toEqual([
  //       [
  //         {
  //           email: 'someone@watches.tv',
  //           amount: 87.23,
  //           memo: 'Long enough',
  //         },
  //       ],
  //     ])
  //   })
  // })
})
