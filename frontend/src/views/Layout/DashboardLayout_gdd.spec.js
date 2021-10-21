import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import DashboardLayoutGdd from './DashboardLayout_gdd'

jest.useFakeTimers()

jest.setTimeout(30000)

const localVue = global.localVue

const storeDispatchMock = jest.fn()
const storeCommitMock = jest.fn()
const routerPushMock = jest.fn()
const apolloMock = jest.fn().mockResolvedValue({
  data: {
    logout: 'success',
  },
})
const toasterMock = jest.fn()

describe('DashboardLayoutGdd', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn(),
    $route: {
      meta: {
        hideFooter: false,
      },
    },
    $router: {
      push: routerPushMock,
      currentRoute: {
        path: '/overview',
      },
    },
    $toasted: {
      error: toasterMock,
    },
    $apollo: {
      query: apolloMock,
    },
    $store: {
      state: {
        email: 'user@example.org',
        publisherId: 123,
        firstName: 'User',
        lastName: 'Example',
      },
      dispatch: storeDispatchMock,
      commit: storeCommitMock,
    },
  }

  const stubs = {
    RouterLink: RouterLinkStub,
    RouterView: true,
  }

  const Wrapper = () => {
    return mount(DashboardLayoutGdd, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a sidebar', () => {
      expect(wrapper.find('nav#sidenav-main').exists()).toBeTruthy()
    })

    it('has a main content div', () => {
      expect(wrapper.find('div.main-content').exists()).toBeTruthy()
    })

    it('has a footer inside the main content', () => {
      expect(wrapper.find('div.main-content').find('footer.footer').exists()).toBeTruthy()
    })

    describe('navigation bar', () => {
      let navbar

      beforeEach(() => {
        navbar = wrapper.findAll('ul.navbar-nav').at(0)
      })

      it('has four items in the navbar', () => {
        expect(navbar.findAll('ul > a')).toHaveLength(4)
      })

      it('has first item "overview" in navbar', () => {
        expect(navbar.findAll('ul > a').at(0).text()).toEqual('overview')
      })

      it('has first item "overview" linked to overview in navbar', () => {
        navbar.findAll('ul > a').at(0).trigger('click')
        expect(wrapper.findComponent(RouterLinkStub).props(0).to).toBe('/overview')
      })

      it('has second item "send" in navbar', () => {
        expect(navbar.findAll('ul > a').at(1).text()).toEqual('send')
      })

      it('has second item "send" linked to /send in navbar', () => {
        navbar.findAll('ul > a').at(1).trigger('click')
        expect(wrapper.findAll('a').at(3).attributes('href')).toBe('/send')
      })

      it('has third item "transactions" in navbar', () => {
        expect(navbar.findAll('ul > a').at(2).text()).toEqual('transactions')
      })

      it('has third item "transactions" linked to transactions in navbar', async () => {
        navbar.findAll('ul > a').at(2).trigger('click')
        expect(wrapper.findAll('a').at(5).attributes('href')).toBe('/transactions')
      })

      it('has fourth item "M profile" in navbar', () => {
        expect(navbar.findAll('ul > a').at(3).text()).toEqual('site.navbar.my-profil')
      })

      it('has fourth item "My profile" linked to profile in navbar', async () => {
        expect(wrapper.findAll('a').at(7).attributes('href')).toBe('/profile')
      })

      it('has a link to the members area', () => {
        expect(wrapper.findAll('ul').at(2).text()).toContain('members_area')
        expect(wrapper.findAll('ul').at(2).text()).toContain('!')
        expect(wrapper.findAll('ul').at(2).find('a').attributes('href')).toBe(
          'https://elopage.com/s/gradido/basic-de/payment?locale=en&prid=111&pid=123&firstName=User&lastName=Example&email=user@example.org',
        )
      })

      it('has a logout button', () => {
        expect(wrapper.findAll('ul').at(3).text()).toBe('logout')
      })

      describe('logout', () => {
        beforeEach(async () => {
          await apolloMock.mockResolvedValue({
            data: {
              logout: 'success',
            },
          })
          await wrapper.findComponent({ name: 'sidebar' }).vm.$emit('logout')
          await flushPromises()
          await wrapper.vm.$nextTick()
        })

        it('calls the API', async () => {
          await expect(apolloMock).toBeCalled()
        })

        it('dispatches logout to store', () => {
          expect(storeDispatchMock).toBeCalledWith('logout')
        })

        it('redirects to login page', () => {
          expect(routerPushMock).toBeCalledWith('/login')
        })
      })

      describe('logout fails', () => {
        beforeEach(async () => {
          apolloMock.mockRejectedValue({
            message: 'error',
          })
          await wrapper.findComponent({ name: 'sidebar' }).vm.$emit('logout')
          await flushPromises()
        })

        it('dispatches logout to store', () => {
          expect(storeDispatchMock).toBeCalledWith('logout')
        })

        it('redirects to login page', () => {
          expect(routerPushMock).toBeCalledWith('/login')
        })

        describe('redirect to login already done', () => {
          beforeEach(() => {
            mocks.$router.currentRoute.path = '/login'
            jest.resetAllMocks()
          })

          it('does not call the redirect to login', () => {
            expect(routerPushMock).not.toBeCalled()
          })
        })
      })

      describe('update balance', () => {
        it('updates the amount correctelly', async () => {
          await wrapper.findComponent({ ref: 'router-view' }).vm.$emit('update-balance', 5)
          await flushPromises()
          expect(wrapper.vm.balance).toBe(-5)
        })
      })

      describe('update transactions', () => {
        beforeEach(async () => {
          apolloMock.mockResolvedValue({
            data: {
              transactionList: {
                gdtSum: 100,
                count: 4,
                balance: 1450,
                decay: 1250,
                transactions: ['transaction', 'transaction', 'transaction', 'transaction'],
              },
            },
          })
          await wrapper
            .findComponent({ ref: 'router-view' })
            .vm.$emit('update-transactions', { currentPage: 2, pageSize: 5 })
          await flushPromises()
        })

        it('calls the API', () => {
          expect(apolloMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                currentPage: 2,
                pageSize: 5,
              },
            }),
          )
        })

        it('updates balance', () => {
          expect(wrapper.vm.balance).toBe(1250)
        })

        it('updates transactions', () => {
          expect(wrapper.vm.transactions).toEqual([
            'transaction',
            'transaction',
            'transaction',
            'transaction',
          ])
        })

        it('updates GDT balance', () => {
          expect(wrapper.vm.GdtBalance).toBe(100)
        })

        it('updates transaction count', () => {
          expect(wrapper.vm.transactionCount).toBe(4)
        })
      })

      describe('update transactions returns error', () => {
        beforeEach(async () => {
          apolloMock.mockRejectedValue({
            message: 'Ouch!',
          })
          await wrapper
            .findComponent({ ref: 'router-view' })
            .vm.$emit('update-transactions', { currentPage: 2, pageSize: 5 })
          await flushPromises()
        })

        it('sets pending to true', () => {
          expect(wrapper.vm.pending).toBeTruthy()
        })

        it('calls $toasted.error method', () => {
          expect(toasterMock).toBeCalledWith('Ouch!')
        })
      })
    })
  })
})
