import { mount, RouterLinkStub } from '@vue/test-utils'
import SideBar from './SideBar'

const localVue = global.localVue

describe('SideBar', () => {
  let wrapper

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const propsData = {
    balance: 1234.56,
  }

  const mocks = {
    $store: {
      state: {
        email: 'test@example.org',
        publisherId: 123,
        firstName: 'test',
        lastName: 'example',
        hasElopage: false,
      },
      commit: jest.fn(),
    },
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
  }

  const Wrapper = () => {
    return mount(SideBar, { localVue, mocks, stubs, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('#sidenav-main').exists()).toBeTruthy()
    })

    describe('navbar button', () => {
      it('has a navbar button', () => {
        expect(wrapper.find('button.navbar-toggler').exists()).toBeTruthy()
      })

      it('calls showSidebar when clicked', async () => {
        const spy = jest.spyOn(wrapper.vm.$sidebar, 'displaySidebar')
        wrapper.find('button.navbar-toggler').trigger('click')
        await wrapper.vm.$nextTick()
        expect(spy).toHaveBeenCalledWith(true)
      })
    })

    describe('balance', () => {
      it('shows em-dash as balance while loading', () => {
        expect(wrapper.find('div.row.text-center').text()).toBe('— GDD')
      })

      it('shows the when loaded', async () => {
        wrapper.setProps({
          pending: false,
        })
        await wrapper.vm.$nextTick()
        expect(wrapper.find('div.row.text-center').text()).toBe('1234.56 GDD')
      })
    })

    describe('close siedbar', () => {
      it('calls closeSidebar when clicked', async () => {
        const spy = jest.spyOn(wrapper.vm.$sidebar, 'displaySidebar')
        wrapper.find('#sidenav-collapse-main').find('button.navbar-toggler').trigger('click')
        await wrapper.vm.$nextTick()
        expect(spy).toHaveBeenCalledWith(false)
      })
    })

    describe('static menu items', () => {
      describe("member's area", () => {
        it('has a link to the elopage', () => {
          expect(wrapper.findAll('li').at(0).text()).toContain('members_area')
        })

        it('has a badge', () => {
          expect(wrapper.findAll('li').at(0).text()).toContain('!')
        })

        it('links to the elopage registration', () => {
          expect(wrapper.findAll('li').at(0).find('a').attributes('href')).toBe(
            'https://elopage.com/s/gradido/basic-de/payment?locale=en&prid=111&pid=123&firstName=test&lastName=example&email=test@example.org',
          )
        })

        describe('with locale="de"', () => {
          beforeEach(() => {
            mocks.$i18n.locale = 'de'
          })

          it('links to the German elopage registration when locale is set to de', () => {
            expect(wrapper.findAll('li').at(0).find('a').attributes('href')).toBe(
              'https://elopage.com/s/gradido/basic-de/payment?locale=de&prid=111&pid=123&firstName=test&lastName=example&email=test@example.org',
            )
          })
        })

        describe('with hasElopage is true', () => {
          beforeEach(() => {
            mocks.$store.state.hasElopage = true
          })

          it('links to the elopage member area', () => {
            expect(wrapper.findAll('li').at(0).find('a').attributes('href')).toBe(
              'https://elopage.com/s/gradido/sign_in?locale=de',
            )
          })

          it('has no badge', () => {
            expect(wrapper.findAll('li').at(0).text()).not.toContain('!')
          })
        })
      })

      describe('logout', () => {
        it('has a logout button', () => {
          expect(wrapper.findAll('li').at(1).text()).toBe('logout')
        })

        it('emits logout when logout is clicked', async () => {
          wrapper.findAll('li').at(1).find('a').trigger('click')
          await wrapper.vm.$nextTick()
          expect(wrapper.emitted('logout')).toEqual([[]])
        })
      })
    })
  })
})
