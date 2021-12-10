import { mount } from '@vue/test-utils'
import Sidebar from './Sidebar.vue'

const localVue = global.localVue

describe('Sidebar', () => {
  let wrapper

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

  const Wrapper = () => {
    return mount(Sidebar, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })
    it('renders the component', () => {
      expect(wrapper.find('div#component-sidebar').exists()).toBeTruthy()
    })
  })

  describe('navigation Navbar', () => {
      
    it('has seven b-nav-item in the navbar', () => {
      expect(wrapper.findAll('.nav-item')).toHaveLength(7)
    })

    it('has first nav-item "overview" in navbar', () => {
      expect(wrapper.findAll('.nav-item').at(0).text()).toEqual('overview')
    })

    it('has first nav-item "send" in navbar', () => {
      expect(wrapper.findAll('.nav-item').at(1).text()).toEqual('send')
    })

    it('has first nav-item "transactions" in navbar', () => {
      expect(wrapper.findAll('.nav-item').at(2).text()).toEqual('transactions')
    })
    it('has first nav-item "my-profil" in navbar', () => {
      expect(wrapper.findAll('.nav-item').at(3).text()).toEqual('site.navbar.my-profil')
    })
    it('has first nav-item "members_area" in navbar', () => {
      expect(wrapper.findAll('.nav-item').at(4).text()).toEqual('members_area')
    })
    it('has first nav-item "admin_area" in navbar', () => {
      expect(wrapper.findAll('.nav-item').at(5).text()).toEqual('admin_area')
    })
    it('has first nav-item "logout" in navbar', () => {
      expect(wrapper.findAll('.nav-item').at(6).text()).toEqual('logout')
    })


  })
})
