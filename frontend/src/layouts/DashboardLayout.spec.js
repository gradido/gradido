import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import DashboardLayout from './DashboardLayout'

import { toastErrorSpy } from '@test/testSetup'
import { async } from 'regenerator-runtime'
// import { nextTick } from 'vue/types/umd'

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
const apolloQueryMock = jest.fn()

describe('DashboardLayout', () => {
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
    $apollo: {
      mutate: apolloMock,
      query: apolloQueryMock,
    },
    $store: {
      state: {
        email: 'user@example.org',
        publisherId: 123,
        firstName: 'User',
        lastName: 'Example',
        token: 'valid-token',
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
    return mount(DashboardLayout, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders DIV .main-page', () => {
      expect(wrapper.find('div.main-page').exists()).toBe(true)
    })
    describe('white Skeleton', () => {
      it('has a component SkeletonOverview', () => {
        expect(wrapper.findComponent({ name: 'SkeletonOverview' }).exists()).toBe(true)
      })
    })
 
    describe.skip('whiteout Skeleton', () => {
      beforeEach(async () => {
        await new Promise(res => setTimeout(res, 1500));
      //  await jest.advanceTimersByTime(1500)
        // jest.useFakeTimers()
        // jest.runTimersToTime(2500)
        // await jest.runAllTimers()
        // await wrapper.vm.$nextTick()
        // await wrapper.setData({
           
        //     skeleton: false,
          
        // })
      })

    

      it('has a component Navbar', () => {
        expect(wrapper.findComponent({ name: 'Navbar' }).exists()).toBe(true)
      })

      it('has a navbar', () => {
        expect(wrapper.find('.main-navbar').exists()).toBe(true)
      })

      it('has a sidebar', () => {
        expect(wrapper.find('.main-sidebar').exists()).toBeTruthy()
      })

      it('has a main content div', () => {
        expect(wrapper.find('div.main-content').exists()).toBeTruthy()
      })

      it('has a footer inside the main content', () => {
        expect(wrapper.find('div.main-page').find('footer.footer').exists()).toBeTruthy()
      })

      describe.skip('navigation bar', () => {
        describe('logout', () => {
          beforeEach(async () => {
            await apolloMock.mockResolvedValue({
              data: {
                logout: 'success',
              },
            })
            await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('logout')
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

        describe.skip('logout fails', () => {
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

        describe.skip('update transactions', () => {
          beforeEach(async () => {
            apolloQueryMock.mockResolvedValue({
              data: {
                transactionList: {
                  balance: {
                    balanceGDT: 100,
                    count: 4,
                    linkCount: 8,
                    balance: 1450,
                    decay: 1250,
                  },
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
            expect(apolloQueryMock).toBeCalledWith(
              expect.objectContaining({
                variables: {
                  currentPage: 2,
                  pageSize: 5,
                },
              }),
            )
          })

          it('updates balance', () => {
            expect(wrapper.vm.balance).toBe(1450)
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

          it('updates transaction link count', () => {
            expect(wrapper.vm.transactionLinkCount).toBe(8)
          })
        })

        describe.skip('update transactions returns error', () => {
          beforeEach(async () => {
            apolloQueryMock.mockRejectedValue({
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

          it('toasts the error message', () => {
            expect(toastErrorSpy).toBeCalledWith('Ouch!')
          })
        })

        // describe('set visible method', () => {
        //   beforeEach(() => {
        //     wrapper.findComponent({ name: 'NavbarNew' }).vm.$emit('set-visible', true)
        //   })

        //   it('sets visible to true', () => {
        //     expect(wrapper.vm.visible).toBe(true)
        //   })
        // })

        // describe('elopage URI', () => {
        //   describe('user has no publisher ID and no elopage', () => {
        //     beforeEach(() => {
        //       mocks.$store.state.publisherId = null
        //       mocks.$store.state.hasElopage = false
        //       wrapper = Wrapper()
        //     })

        //     it('links to basic-de', () => {
        //       expect(wrapper.vm.elopageUri).toBe(
        //         'https://elopage.com/s/gradido/basic-de/payment?locale=en&prid=111&pid=2896&firstName=User&lastName=Example&email=user@example.org',
        //       )
        //     })
        //   })

        //   describe('user has elopage', () => {
        //     beforeEach(() => {
        //       mocks.$store.state.publisherId = '123'
        //       mocks.$store.state.hasElopage = true
        //       wrapper = Wrapper()
        //     })

        //     it('links to sign in for elopage', () => {
        //       expect(wrapper.vm.elopageUri).toBe('https://elopage.com/s/gradido/sign_in?locale=en')
        //     })
        //   })
        // })

        // describe('admin method', () => {
        //   const windowLocationMock = jest.fn()
        //   beforeEach(() => {
        //     delete window.location
        //     window.location = {
        //       assign: windowLocationMock,
        //     }
        //     wrapper.findComponent({ name: 'NavbarNew' }).vm.$emit('admin')
        //   })

        //   it('dispatches logout to store', () => {
        //     expect(storeDispatchMock).toBeCalled()
        //   })

        //   it('changes window location to admin interface', () => {
        //     expect(windowLocationMock).toBeCalledWith(
        //       'http://localhost/admin/authenticate?token=valid-token',
        //     )
        //   })
        // })
      })

      describe('set tunneled email', () => {
        it('updates tunneled email', async () => {
          await wrapper
            .findComponent({ ref: 'router-view' })
            .vm.$emit('set-tunneled-email', 'bibi@bloxberg.de')
          expect(wrapper.vm.tunneledEmail).toBe('bibi@bloxberg.de')
        })
      })
    })
  })
})
