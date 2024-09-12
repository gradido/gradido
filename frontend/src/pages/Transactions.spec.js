import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import Transactions from './Transactions.vue'
import { GdtEntryType } from '@/graphql/enums'

const mockScrollTo = vi.fn()
window.scrollTo = mockScrollTo

const mockRoute = { path: '/transactions' }
const mockRouterReplace = vi.fn()
const mockRouter = {
  replace: mockRouterReplace,
}
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => mockRouter),
}))

const mockLoadGdt = vi.fn()
const mockOnResult = vi.fn()
const mockOnError = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useLazyQuery: vi.fn(() => ({
    load: mockLoadGdt,
    onResult: mockOnResult,
    onError: mockOnError,
  })),
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

// Mock GddTransactionList and GdtTransactionList components
vi.mock('@/components/GddTransactionList', () => ({
  default: {
    name: 'GddTransactionList',
    template: '<div class="mock-gdd-transaction-list"></div>',
  },
}))

vi.mock('@/components/GdtTransactionList', () => ({
  default: {
    name: 'GdtTransactionList',
    template: '<div class="mock-gdt-transaction-list"></div>',
  },
}))

describe('Transactions', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(Transactions, {
      props,
      global: {
        mocks: {
          $t: (key) => key,
          $n: (n) => String(n),
          $d: (d) => d,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('renders page', () => {
    wrapper = createWrapper()
    expect(wrapper.find('.transactions').exists()).toBe(true)
  })

  it('renders the GDD transaction table when gdt is false', () => {
    wrapper = createWrapper({ gdt: false })
    expect(wrapper.find('.mock-gdd-transaction-list').exists()).toBe(true)
  })

  it('renders the GDT transaction table when gdt is true', () => {
    wrapper = createWrapper({ gdt: true })
    expect(wrapper.find('.mock-gdt-transaction-list').exists()).toBe(true)
  })

  it('emits update-transactions when update-transactions is called', async () => {
    wrapper = createWrapper()
    await wrapper
      .findComponent({ name: 'GddTransactionList' })
      .vm.$emit('update-transactions', { currentPage: 2, pageSize: 25 })
    expect(wrapper.emitted('update-transactions')).toEqual([[{ currentPage: 2, pageSize: 25 }]])
  })

  describe('GDT transactions', () => {
    beforeEach(() => {
      wrapper = createWrapper({ gdt: true })
    })

    it('calls loadGdt on mount', () => {
      expect(mockLoadGdt).toHaveBeenCalled()
    })

    it('updates GDT transactions on successful query', async () => {
      const mockResult = {
        data: {
          listGDTEntries: {
            count: 4,
            gdtEntries: [
              {
                id: 1,
                amount: 100,
                gdt: 1700,
                factor: 17,
                comment: '',
                date: '2021-05-02T17:20:11+00:00',
                gdtEntryType: GdtEntryType.FORM,
              },
            ],
          },
        },
      }

      mockOnResult.mock.calls[0][0](mockResult)
      await nextTick()

      expect(wrapper.vm.transactionsGdt).toEqual(mockResult.data.listGDTEntries.gdtEntries)
      expect(wrapper.vm.transactionGdtCount).toBe(4)
    })

    it('calls router.replace when on /transactions path', async () => {
      const mockResult = { data: { listGDTEntries: { count: 0, gdtEntries: [] } } }
      mockOnResult.mock.calls[0][0](mockResult)
      await nextTick()

      expect(mockRouterReplace).toHaveBeenCalledWith('/gdt')
      expect(mockScrollTo).toHaveBeenCalledWith(0, 0)
    })

    it('handles error in GDT query', async () => {
      const error = new Error('API Error')
      mockOnError.mock.calls[0][0](error)
      await nextTick()

      expect(wrapper.vm.transactionGdtCount).toBe(-1)
      expect(mockToastError).toHaveBeenCalledWith('API Error')
    })

    it('updates GDT transactions when currentPage changes', async () => {
      await wrapper.setProps({ gdt: true })
      vi.clearAllMocks()

      wrapper.vm.currentPage = 2
      await nextTick()

      expect(mockLoadGdt).toHaveBeenCalled()
    })
  })
})
