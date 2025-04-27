import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import DashboardLayout from './DashboardLayout'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '@/routes/routes'
import { useQuery } from '@vue/apollo-composable'

const toastErrorSpy = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: toastErrorSpy,
  }),
}))

const mockRefetchFn = vi.fn()
const mockMutateFn = vi.fn()
let onErrorHandler
const mockQueryResult = ref(null)
const data = ref({})
const loading = ref(false)

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    data,
    refetch: mockRefetchFn,
    result: mockQueryResult,
    onResult: vi.fn(),
    onError: (handler) => {
      onErrorHandler = handler
    },
    loading,
  })),
  useLazyQuery: vi.fn(() => ({
    refetch: mockRefetchFn,
    result: mockQueryResult,
    onResult: vi.fn(),
    onError: (handler) => {
      onErrorHandler = handler
    },
    loading,
  })),
  useMutation: vi.fn(() => ({
    mutate: mockMutateFn,
    onDone: vi.fn(),
    onError: vi.fn(),
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (value) => value,
    n: (value) => value,
  }),
}))

const router = createRouter({
  history: createWebHistory(),
  routes,
})

describe('DashboardLayout', () => {
  let wrapper
  let store
  let logoutSpy
  let routerPushSpy

  const createVuexStore = () => {
    logoutSpy = vi.fn()
    return createStore({
      state: {
        publisherId: 123,
        firstName: 'User',
        lastName: 'Example',
        token: 'valid-token',
        roles: [],
      },
      actions: {
        logout: logoutSpy,
      },
    })
  }

  const createWrapper = () => {
    store = createVuexStore()
    routerPushSpy = vi.spyOn(router, 'push')
    return mount(DashboardLayout, {
      global: {
        plugins: [store, router],
        stubs: {
          RouterLink: true,
          RouterView: true,
          LastTransactions: true,
          Navbar: true,
          Sidebar: true,
          MobileSidebar: true,
          Breadcrumb: true,
          ContentHeader: true,
          RightSide: true,
          ContentFooter: true,
          SkeletonOverview: true,
          'fade-transition': true,
        },
        mocks: {
          $t: (key) => key,
          $d: (d) => d,
          $n: vi.fn(),
          $i18n: {
            locale: 'en',
          },
        },
      },
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    data.value = {
      communityStatistics: {
        totalUsers: 3113,
        activeUsers: 1057,
        deletedUsers: 35,
        totalGradidoCreated: '4083774.05000000000000000000',
        totalGradidoDecayed: '-1062639.13634129622923372197',
        totalGradidoAvailable: '2513565.869444365732411569',
        totalGradidoUnbookedDecayed: '-500474.6738366222166261272',
      },
    }
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  it('renders DIV .main-page', () => {
    expect(wrapper.find('div.main-page').exists()).toBe(true)
  })

  describe('at first', () => {
    beforeEach(() => {
      data.value = null
    })
    it('renders a component Skeleton', () => {
      expect(wrapper.findComponent({ name: 'SkeletonOverview' }).exists()).toBe(true)
    })
  })

  describe('after a timeout', () => {
    beforeEach(async () => {
      vi.advanceTimersByTime(1500)
      loading.value = false
      await nextTick()
    })

    describe('update transactions', () => {
      beforeEach(async () => {
        data.value = {
          transactionList: {
            balance: {
              balanceGDT: '100',
              count: 4,
              linkCount: 8,
              balance: '1450',
            },
            transactions: ['transaction1', 'transaction2', 'transaction3', 'transaction4'],
          },
        }

        await wrapper.vm.updateTransactions({ currentPage: 2, pageSize: 5 })
        await nextTick() // Ensure all promises are resolved
      })

      it('load call to the API', () => {
        expect(useQuery).toHaveBeenCalled()
      })

      it('updates balance', () => {
        expect(wrapper.vm.balance).toBe(1450)
      })

      it('updates transactions', () => {
        expect(wrapper.vm.transactions).toEqual([
          'transaction1',
          'transaction2',
          'transaction3',
          'transaction4',
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

    describe('update transactions returns error', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ ref: 'router-view' })
          .vm.$emit('update-transactions', { currentPage: 2, pageSize: 5 })
        loading.value = true
        await nextTick()
      })

      it('sets pending to true', () => {
        expect(wrapper.vm.pending).toBeTruthy()
      })

      it('toasts the error message', () => {
        onErrorHandler({ message: 'Ouch!' })
        expect(toastErrorSpy).toHaveBeenCalledWith('Ouch!')
      })
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

    describe('navigation bar', () => {
      describe('logout', () => {
        beforeEach(async () => {
          mockMutateFn.mockResolvedValue({ logout: 'success' })
          await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('logout')
          await nextTick()
        })

        it('calls the API', () => {
          expect(mockMutateFn).toHaveBeenCalled()
        })

        it('dispatches logout to store', () => {
          expect(logoutSpy).toHaveBeenCalled()
        })

        it('redirects to login page', () => {
          expect(routerPushSpy).toHaveBeenCalledWith('/login')
        })
      })

      describe('logout fails', () => {
        beforeEach(async () => {
          mockMutateFn.mockRejectedValue(new Error('error'))
          await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('logout')
          await nextTick()
        })

        it('dispatches logout to store', () => {
          expect(logoutSpy).toHaveBeenCalled()
        })

        it('redirects to login page', () => {
          expect(routerPushSpy).toHaveBeenCalledWith('/login')
        })

        describe('redirect to login already done', () => {
          beforeEach(async () => {
            await router.push('/login')
            vi.clearAllMocks()
          })

          it('does not call the redirect to login', async () => {
            const routerPushSpy = vi.spyOn(router, 'push')
            await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('logout')
            await nextTick()
            expect(routerPushSpy).not.toHaveBeenCalled()
          })
        })
      })
    })

    describe.skip('set visible method', () => {
      beforeEach(async () => {
        await wrapper.findComponent({ name: 'NavbarNew' }).vm.$emit('set-visible', true)
      })

      it('sets visible to true', () => {
        expect(wrapper.vm.visible).toBe(true)
      })
    })

    describe.skip('admin method', () => {
      const windowLocationMock = vi.fn()
      beforeEach(() => {
        delete window.location
        window.location = { assign: windowLocationMock }
        wrapper.findComponent({ name: 'NavbarNew' }).vm.$emit('admin')
      })

      it('dispatches logout to store', () => {
        expect(store.dispatch).toHaveBeenCalledWith('logout')
      })

      it('changes window location to admin interface', () => {
        expect(windowLocationMock).toHaveBeenCalledWith(
          'http://localhost/admin/authenticate?token=valid-token',
        )
      })
    })
  })
})
