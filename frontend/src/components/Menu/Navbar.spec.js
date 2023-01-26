import { mount } from '@vue/test-utils'
import Navbar from './Navbar'

const localVue = global.localVue

const propsData = {
  balance: 1234,
//  visible: false,
//  pending: false,
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

    describe('navigation Navbar (general elements)', () => {
      it.only('has .navbar-brand in the navbar', () => {
        expect(wrapper.find('div.navbar-brand').exists()).toBeTruthy()
      })

      it('has b-navbar-toggle in the navbar', () => {
        expect(wrapper.find('.navbar-toggler').exists()).toBeTruthy()
      })

      it('has thirteen b-nav-item in the navbar', () => {
        expect(wrapper.findAll('.nav-item')).toHaveLength(12)
      })

      it('has nav-item "amount GDD" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(1).text()).toEqual('1234 GDD')
      })

      it('has nav-item "navigation.overview" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(3).text()).toEqual('navigation.overview')
      })

      it('has nav-item "navigation.send" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(4).text()).toEqual('navigation.send')
      })

      it('has nav-item "navigation.transactions" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(5).text()).toEqual('navigation.transactions')
      })

      it('has nav-item "gdt.gdt" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(6).text()).toEqual('gdt.gdt')
      })

      it('has nav-item "navigation.community" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(7).text()).toEqual('navigation.community')
      })

      it('has nav-item "navigation.profile" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(8).text()).toEqual('navigation.profile')
      })

      it('has nav-item "navigation.info" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(9).text()).toEqual('navigation.info')
      })
    })

    describe('navigation Navbar', () => {
      it('has nav-item "navigation.admin_area" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(10).text()).toEqual('navigation.admin_area')
      })

      it('has nav-item "navigation.logout" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(11).text()).toEqual('navigation.logout')
      })
    })

    describe('navigation Navbar (user has no elopage account)', () => {
      beforeAll(() => {
        mocks.$store.state.hasElopage = false
        wrapper = Wrapper()
      })

      it('has nav-item "navigation.admin_area" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(10).text()).toEqual('navigation.admin_area')
      })

      it('has nav-item "navigation.logout" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(11).text()).toEqual('navigation.logout')
      })
    })
  })

  describe('check watch visible true', () => {
    beforeEach(async () => {
      await wrapper.setProps({ visible: true })
    })

    it('has visibleCollapse == visible', () => {
      expect(wrapper.vm.visibleCollapse).toBe(true)
    })
  })

  describe('check watch visible false', () => {
    beforeEach(async () => {
      await wrapper.setProps({ visible: false })
    })

    it('has visibleCollapse == visible', () => {
      expect(wrapper.vm.visibleCollapse).toBe(false)
    })
  })
})
