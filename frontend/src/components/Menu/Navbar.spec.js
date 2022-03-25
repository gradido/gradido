import { mount } from '@vue/test-utils'
import Navbar from './Navbar'

const localVue = global.localVue

const propsData = {
  balance: 1234,
  visible: false,
  elopageUri: 'https://elopage.com',
  pending: false,
}

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $store: {
    state: {
      hasElopage: false,
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

    describe('navigation Navbar', () => {
      it('has .navbar-brand in the navbar', () => {
        expect(wrapper.find('.navbar-brand').exists()).toBeTruthy()
      })
      it('has b-navbar-toggle in the navbar', () => {
        expect(wrapper.find('.navbar-toggler').exists()).toBeTruthy()
      })
      it('has ten b-nav-item in the navbar', () => {
        expect(wrapper.findAll('.nav-item')).toHaveLength(10)
      })

      it('has first nav-item "amount GDD" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(1).text()).toEqual('1234 GDD')
      })

      it('has first nav-item "navigation.overview" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(3).text()).toEqual('navigation.overview')
      })
      it('has first nav-item "navigation.send" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(4).text()).toEqual('navigation.send')
      })
      it('has first nav-item "navigation.transactions" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(5).text()).toEqual('navigation.transactions')
      })
      it('has first nav-item "navigation.profile" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(6).text()).toEqual('navigation.profile')
      })

      it('has a link to the members area', () => {
        expect(wrapper.findAll('.nav-item').at(7).text()).toContain('navigation.members_area')
        expect(wrapper.findAll('.nav-item').at(7).find('a').attributes('href')).toBe(
          'https://elopage.com',
        )
      })

      it('has first nav-item "navigation.admin_area" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(8).text()).toEqual('navigation.admin_area')
      })
      it('has first nav-item "navigation.logout" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(9).text()).toEqual('navigation.logout')
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
