import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionCollapse from './TransactionCollapse.vue'
import { GdtEntryType } from '@/graphql/enums'

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

describe('TransactionCollapse', () => {
  let wrapper

  const mocks = {
    $t: vi.fn((t) => t),
    $n: vi.fn((n) => n),
  }

  const Wrapper = (propsData) => {
    return mount(TransactionCollapse, { global: { mocks }, props: propsData })
  }

  describe('no valid GDT entry type', () => {
    it('throws an error for invalid gdtEntryType', async () => {
      const wrapper = mount(TransactionCollapse, {
        props: {
          amount: 100,
          gdt: 110,
          factor: 22,
          gdtEntryType: GdtEntryType.FORM,
        },
        global: {
          mocks: {
            $t: (msg) => msg,
            $n: (n) => n,
          },
        },
      })

      await expect(async () => {
        await wrapper.setProps({ gdtEntryType: 'NOT_VALID' })
      }).rejects.toThrow('no additional transaction info for this type: NOT_VALID')
    })
  })

  describe('mount with gdtEntryType: FORM', () => {
    beforeEach(() => {
      const propsData = {
        amount: 100,
        gdt: 110,
        factor: 22,
        gdtEntryType: GdtEntryType.FORM,
      }
      wrapper = Wrapper(propsData)
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-collapse').exists()).toBe(true)
    })

    it('checks the prop gdtEntryType', () => {
      expect(wrapper.props().gdtEntryType).toBe('FORM')
    })

    it('renders the component collapse-header', () => {
      expect(wrapper.find('.gdt-list-collapse-header-text').exists()).toBe(true)
    })

    it('renders the component collapse-headline', () => {
      expect(wrapper.find('.collapse-headline').text()).toBe('gdt.calculation')
    })

    it('renders the component collapse-first', () => {
      expect(wrapper.find('.collapse-first').text()).toBe('gdt.factor')
    })

    it('renders the component collapse-second', () => {
      expect(wrapper.find('.collapse-second').text()).toBe('gdt.formula')
    })

    it('renders the component collapse-firstMath', () => {
      expect(wrapper.find('.collapse-firstMath').text()).toBe('22 GDT pro €')
    })

    it('renders the component collapse-secondMath', () => {
      expect(wrapper.find('.collapse-secondMath').text()).toBe('100 € * 22 GDT / € = 110 GDT')
    })
  })

  describe('mount with gdtEntryType: GLOBAL_MODIFICATOR', () => {
    beforeEach(() => {
      const propsData = {
        amount: 100,
        gdt: 2200,
        factor: 22,
        gdtEntryType: GdtEntryType.GLOBAL_MODIFICATOR,
      }

      wrapper = Wrapper(propsData)
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-collapse').exists()).toBe(true)
    })

    it('checks the prop gdtEntryType', () => {
      expect(wrapper.props().gdtEntryType).toBe('GLOBAL_MODIFICATOR')
    })

    it('renders the component collapse-header', () => {
      expect(wrapper.find('.gdt-list-collapse-header-text').exists()).toBe(true)
    })

    it('renders the component collapse-headline', () => {
      expect(wrapper.find('.collapse-headline').text()).toBe('gdt.conversion-gdt-euro')
    })

    it('renders the component collapse-first', () => {
      expect(wrapper.find('.collapse-first').text()).toBe('gdt.raise')
    })

    it('renders the component collapse-second', () => {
      expect(wrapper.find('.collapse-second').text()).toBe('gdt.conversion')
    })

    it('renders the component collapse-firstMath', () => {
      expect(wrapper.find('.collapse-firstMath').text()).toBe('2200 %')
    })

    it('renders the component collapse-secondMath', () => {
      expect(wrapper.find('.collapse-secondMath').text()).toBe('100 GDT * 2200 % = 2200 GDT')
    })
  })

  describe('mount with gdtEntryType: ELOPAGE_PUBLISHER', () => {
    beforeEach(() => {
      const propsData = {
        amount: 100,
        gdt: 2200,
        factor: 22,
        gdtEntryType: GdtEntryType.ELOPAGE_PUBLISHER,
      }

      wrapper = Wrapper(propsData)
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-collapse').exists()).toBe(true)
    })

    it('checks the prop gdtEntryType', () => {
      expect(wrapper.props().gdtEntryType).toBe('ELOPAGE_PUBLISHER')
    })

    it('renders the component collapse-header', () => {
      expect(wrapper.find('.gdt-list-collapse-header-text').exists()).toBe(true)
    })

    it('renders the component collapse-headline', () => {
      expect(wrapper.find('.collapse-headline').text()).toBe('gdt.publisher')
    })

    it('renders the component collapse-first', () => {
      expect(wrapper.find('.collapse-first').text()).toBe('')
    })

    it('renders the component collapse-second', () => {
      expect(wrapper.find('.collapse-second').text()).toBe('')
    })

    it('renders the component collapse-firstMath', () => {
      expect(wrapper.find('.collapse-firstMath').text()).toBe('')
    })

    it('renders the component collapse-secondMath', () => {
      expect(wrapper.find('.collapse-secondMath').text()).toBe('')
    })
  })
})
