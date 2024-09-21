import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionLinkSummary from './TransactionLinkSummary'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import CollapseLinksList from '../DecayInformations/CollapseLinksList'
import { BAvatar, BCol, BCollapse, BRow } from 'bootstrap-vue-next'

vi.mock('../TransactionRows/CollapseIcon', () => ({
  default: {
    name: 'CollapseIcon',
    render: () => null,
  },
}))

vi.mock('../DecayInformations/CollapseLinksList', () => ({
  default: {
    name: 'CollapseLinksList',
    render: () => null,
  },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (date, format) => `Mocked ${format} date for ${date}`,
  }),
}))

const mockRefetch = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    refetch: mockRefetch,
    loading: false,
    error: null,
  })),
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

const mocks = {
  $filters: {
    GDD: vi.fn((value) => `Mocked GDD: ${value}`),
  },
}

const propsData = {
  amount: '123',
  decay: {
    decay: '-0.2038314055482643084',
    start: '2022-02-25T07:29:26.000Z',
    end: '2022-02-28T13:55:47.000Z',
    duration: 282381,
  },
  transactionLinkCount: 4,
}

describe('TransactionLinkSummary', () => {
  let wrapper

  const createWrapper = () => {
    return mount(TransactionLinkSummary, {
      global: {
        mocks: {
          ...mocks,
          $t: (key) => key,
        },
        stubs: {
          BRow,
          BCol,
          BCollapse,
          BAvatar,
          VariantIcon: true,
        },
      },
      props: propsData,
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component transaction-slot-link', () => {
    expect(wrapper.find('div.transaction-slot-link').exists()).toBe(true)
  })

  it('displays the correct amount', () => {
    const amountElement = wrapper.find('.fw-bold')
    expect(amountElement.text()).toBe('Mocked GDD: 123')
  })

  it('displays the correct transaction link count', () => {
    const countElement = wrapper.find('.small')
    expect(countElement.text()).toContain('4')
    expect(countElement.text()).toContain('gdd_per_link.links_sum')
  })

  it('has a CollapseIcon component', () => {
    expect(wrapper.findComponent(CollapseIcon).exists()).toBe(true)
  })

  it('has a CollapseLinksList component', () => {
    expect(wrapper.findComponent(CollapseLinksList).exists()).toBe(true)
  })

  describe('showTransactionLinks', () => {
    it('toggles visibility when clicked', async () => {
      const linkSlot = wrapper.find('.transaction-slot-link')
      expect(wrapper.vm.visible).toBe(false)
      await linkSlot.trigger('click')
      expect(wrapper.vm.visible).toBe(true)
      await linkSlot.trigger('click')
      expect(wrapper.vm.visible).toBe(false)
    })

    it('does not toggle visibility when clicking on link-menu-opener', async () => {
      const showTransactionLinksSpy = vi.spyOn(wrapper.vm, 'showTransactionLinks')
      await wrapper.vm.showTransactionLinks({ target: { classList: ['link-menu-opener'] } })
      expect(showTransactionLinksSpy).toHaveBeenCalled()
      expect(wrapper.vm.visible).toBe(false)
    })

    it('resets transactionLinks and currentPage when opening', async () => {
      const linkSlot = wrapper.find('.transaction-slot-link')
      wrapper.vm.transactionLinks.value = ['some data']
      wrapper.vm.currentPage = 2
      await linkSlot.trigger('click')
      expect(wrapper.vm.transactionLinks).toEqual([])
      expect(wrapper.vm.currentPage).toBe(1)
    })
  })

  describe('updateListTransactionLinks', () => {
    it('fetches transaction links when called', async () => {
      mockRefetch.mockResolvedValue({
        data: {
          listTransactionLinks: {
            links: [{ id: 1 }, { id: 2 }],
          },
        },
      })
      await wrapper.vm.updateListTransactionLinks()
      expect(mockRefetch).toHaveBeenCalledWith({ currentPage: 1 })
      expect(wrapper.vm.transactionLinks).toHaveLength(2)
    })

    it('handles errors when fetching transaction links', async () => {
      mockRefetch.mockRejectedValue(new Error('API Error'))
      await wrapper.vm.updateListTransactionLinks()
      expect(mockToastError).toHaveBeenCalledWith('API Error')
    })

    it('resets transaction links when currentPage is 0', async () => {
      wrapper.vm.transactionLinks.value = [{ id: 1 }]
      wrapper.vm.currentPage = 0
      await wrapper.vm.updateListTransactionLinks()
      expect(wrapper.vm.transactionLinks).toEqual([])
      expect(wrapper.vm.currentPage).toBe(1)
    })
  })

  it('emits update-transactions event after fetching links', async () => {
    mockRefetch.mockResolvedValue({
      data: {
        listTransactionLinks: {
          links: [{ id: 1 }],
        },
      },
    })
    await wrapper.vm.updateListTransactionLinks()
    expect(wrapper.emitted('update-transactions')).toBeTruthy()
  })
})
