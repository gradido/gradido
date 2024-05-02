import { mount } from '@vue/test-utils'
import Sidebar from './Sidebar'

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
        roles: [],
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

    describe('the general section', () => {
      it('has eight nav-items', () => {
        expect(wrapper.findAll('ul').at(0).findAll('.nav-item')).toHaveLength(8)
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

      it('has nav-item "creation" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(3).text()).toEqual('creation')
      })

      it('has nav-item "GDT" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(4).text()).toContain('GDT')
      })

      it('has nav-item "navigation.info" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(5).text()).toContain('navigation.info')
      })

      it('has nav-item "navigation.circles" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(6).text()).toContain('navigation.circles')
      })

      it('has nav-item "navigation.usersearch" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(7).text()).toContain('navigation.usersearch')
      })
    })

    describe('the specific section', () => {
      describe('for standard users', () => {
        it('has two nav-items', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item')).toHaveLength(2)
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.find('[data-test="settings-menu"]').find('span').text()).toBe(
            'navigation.settings',
          )
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(1).text()).toEqual(
            'navigation.logout',
          )
        })
      })

      describe('for admin users', () => {
        beforeAll(() => {
          mocks.$store.state.roles = ['admin']
          wrapper = Wrapper()
        })

        it('has three nav-items', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item')).toHaveLength(3)
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.find('[data-test="settings-menu"]').find('span').text()).toBe(
            'navigation.settings',
          )
        })

        it('has nav-item "navigation.admin_area" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(1).text()).toEqual(
            'navigation.admin_area',
          )
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.findAll('ul').at(1).findAll('.nav-item').at(2).text()).toEqual(
            'navigation.logout',
          )
        })
      })
    })
  })
})
