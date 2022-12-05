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
        isAdmin: false,
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
      expect(wrapper.find('div#component-sidebar').exists()).toBe(true)
    })

    describe('the genaral section', () => {
      it('has five nav-item', () => {
        expect(wrapper.findAll('ul').at(0).findAll('.nav-item')).toHaveLength(5)
      })

      it('has nav-item "navigation.overview" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(0).text()).toEqual('navigation.overview')
      })

      it('has nav-item "navigation.send" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(1).text()).toEqual('navigation.send')
      })

      it('has nav-item "navigation.transactions" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(2).text()).toEqual('navigation.transactions')
      })

      it('has nav-item "gdt.gdt" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(3).text()).toEqual('gdt.gdt')
      })

      it('has nav-item "navigation.members" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(4).text()).toContain('navigation.members')
      })
    })

    describe('the specific section', () => {
      describe('for standard users', () => {
        it('has three nav-item', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item')).toHaveLength(4)
        })

        it('has nav-item "navigation.info" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(0).text()).toEqual(
            'navigation.info',
          )
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(1).text()).toEqual(
            'navigation.settings',
          )
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(2).text()).toEqual(
            'navigation.logout',
          )
        })
      })

      describe('for admin users', () => {
        beforeAll(() => {
          mocks.$store.state.isAdmin = true
          wrapper = Wrapper()
        })

        it('has four nav-item', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item')).toHaveLength(5)
        })

        it('has nav-item "navigation.info" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(0).text()).toEqual(
            'navigation.info',
          )
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(1).text()).toEqual(
            'navigation.settings',
          )
        })

        it('has nav-item "navigation.admin_area" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(2).text()).toEqual(
            'navigation.admin_area',
          )
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(3).text()).toEqual(
            'navigation.logout',
          )
        })
      })
    })
  })
})
