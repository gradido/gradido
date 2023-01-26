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

    describe('navigation Navbar', () => {
      it('has ten b-nav-item in the navbar', () => {
        expect(wrapper.findAll('.nav-item')).toHaveLength(9)
      })

      describe('navigation Navbar (general elements)', () => {
        it('has nav-item "navigation.overview" in navbar', () => {
          expect(wrapper.findAll('.nav-item').at(0).text()).toEqual('navigation.overview')
        })

        it('has nav-item "navigation.send" in navbar', () => {
          expect(wrapper.findAll('.nav-item').at(1).text()).toEqual('navigation.send')
        })

        it('has nav-item "gdt.gdt" in navbar', () => {
          expect(wrapper.findAll('.nav-item').at(3).text()).toEqual('gdt.gdt')
        })

        it('has nav-item "navigation.community" in navbar', () => {
          expect(wrapper.findAll('.nav-item').at(4).text()).toContain('navigation.community')
        })

        it('has nav-item "navigation.profile" in navbar', () => {
          expect(wrapper.findAll('.nav-item').at(5).text()).toEqual('navigation.profile')
        })

        it('has nav-item "navigation.info" in navbar', () => {
          expect(wrapper.findAll('.nav-item').at(6).text()).toEqual('navigation.info')
        })
      })

      describe('navigation Navbar', () => {
        it('has ten b-nav-item in the navbar', () => {
          expect(wrapper.findAll('.nav-item')).toHaveLength(9)
        })

        it('has nav-item "navigation.admin_area" in navbar', () => {
          expect(wrapper.findAll('.nav-item').at(7).text()).toEqual('navigation.admin_area')
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.findAll('.nav-item').at(8).text()).toEqual('navigation.logout')
        })
      })

      it('has nav-item "navigation.admin_area" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(7).text()).toEqual('navigation.admin_area')
      })

      it('has nav-item "navigation.logout" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(8).text()).toEqual('navigation.logout')
      })
    })

    describe('navigation Navbar', () => {
      beforeAll(() => {
        mocks.$store.state.hasElopage = false
        wrapper = Wrapper()
      })

      it('has nine b-nav-item in the navbar', () => {
        expect(wrapper.findAll('.nav-item')).toHaveLength(9)
      })

      it('has nav-item "navigation.admin_area" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(7).text()).toEqual('navigation.admin_area')
      })

      it('has nav-item "navigation.logout" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(8).text()).toEqual('navigation.logout')
      })
    })
  })
})
