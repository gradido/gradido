import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionLinkSummary from './TransactionLinkSummary'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import CollapseLinksList from '../DecayInformations/CollapseLinksList'
import { BAvatar, BCol, BCollapse, BRow } from 'bootstrap-vue-next'
import { LIST_AVATAR_SIZE } from '@/constants'

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
  openLinkCount: 2,
}

describe('TransactionLinkSummary', () => {
  let wrapper

  const createWrapper = () => {
    return mount(TransactionLinkSummary, {
      global: {
        mocks: {
          ...mocks,
          // values are kept in the string so a test can see the number that went in
          $t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
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

  // The line underneath names the links that can still be redeemed - two of the four the
  // list holds. Counting all of them told members about links that had long expired.
  it('counts only the open links, not every link in the list', () => {
    const countElement = wrapper.find('.small')
    expect(countElement.text()).toContain('gdd_per_link.links_open')
    expect(countElement.text()).toContain('2')
    expect(countElement.text()).not.toContain('4')
  })

  // What stood over the amount was the label of the send button, which describes no sum.
  // It was wrong for months without anyone noticing, so the heading is gone for good.
  it('puts no heading over the amount', () => {
    expect(wrapper.text()).not.toContain('send_per_link')
  })

  // This row stands in the list of bookings, where every other row has a face -- so its
  // symbol takes the size every list of people uses (LIST_AVATAR_SIZE, 11.09.2026).
  it('draws its symbol at the size of the faces in the rows around it', () => {
    expect(wrapper.findComponent(BAvatar).props().size).toBe(LIST_AVATAR_SIZE)
  })

  it('has a CollapseIcon component', () => {
    expect(wrapper.findComponent(CollapseIcon).exists()).toBe(true)
  })

  it('has a CollapseLinksList component', () => {
    expect(wrapper.findComponent(CollapseLinksList).exists()).toBe(true)
  })

  /**
   * The head of the list on a phone. It carried the same fault as the booking row did until
   * 11.09.2026: the arrow sat on `cols=12`, so under `md` it dropped onto a line of its own
   * at the bottom of the card, where nobody looks for it (Bernd, 12.09.2026, with pictures).
   *
   * ⛔ Read off the REAL BRow/BCol, which this file already mounts. bootstrap-vue-next works
   * the classes out from the props, and a stub would answer to any prop name without
   * producing a single one of them.
   */
  describe('the head of the list', () => {
    const columnsOf = () => wrapper.findAll('.transaction-slot-link > .row > *')

    it('keeps the arrow beside the amount instead of giving it a line of its own', () => {
      const arrow = wrapper.findComponent(CollapseIcon).element.parentElement
      expect(arrow.classList.contains('col-auto')).toBe(true)
      expect(arrow.classList.contains('col-12')).toBe(false)
    })

    it('breaks the line once under md, so amount and arrow share one line there', () => {
      const breaks = columnsOf().filter(
        (column) => column.classes().includes('w-100') && column.classes().includes('d-md-none'),
      )
      expect(breaks).toHaveLength(1)
    })

    /**
     * ⛔ `col` written out. bootstrap-vue-next gives the plain `col` class only to a column
     * with no breakpoint size at all; with `md`/`lg` set and no `col`, the phone got no
     * width class and Bootstrap's `.row > *` made this 100% wide beside its 25% offset --
     * the fault that cost the map page a sideways scroll on 11.09.2026.
     */
    it('gives the amount a width on the phone as well', () => {
      const amount = columnsOf().find((column) => column.classes().includes('offset-3'))
      expect(amount.classes()).toContain('col')
    })
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
