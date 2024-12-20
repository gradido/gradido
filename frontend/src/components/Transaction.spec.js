import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Transaction from './Transaction'
import { nextTick } from 'vue'
import { BAvatar, BCol, BCollapse, BRow } from 'bootstrap-vue-next'
import TransactionCollapse from '@/components/TransactionCollapse.vue'
import { GdtEntryType } from '@/graphql/enums'
import VariantIcon from '@/components/VariantIcon.vue'
import { createStore } from 'vuex'

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    n: (value) => value?.toString() ?? '',
    d: (value) => value?.toString() ?? '',
  }),
}))

describe('Transaction', () => {
  let wrapper

  const createWrapper = (props = {}, options = {}) => {
    return mount(Transaction, {
      props: {
        ...props,
      },
      global: {
        plugins: [
          createStore({
            state: {
              transactionToHighlightId: '',
            },
          }),
        ],
        mocks: {
          $d: (value) => value?.toString() ?? '',
          $n: (value) => value?.toString() ?? '',
          $t: (value) => value?.toString() ?? '',
        },
        stubs: {
          BRow,
          BCol,
          BAvatar,
          BCollapse: {
            template: `
              <div
                :id="id"
                class="collapse"
                :class="{ show: modelValue }"
                data-test="collapse"
              >
                <slot/>
              </div>
            `,
            props: ['id', 'modelValue'],
          },
          VariantIcon,
          ...options.stubs,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-list').exists()).toBe(true)
    })

    it('has a collapse icon bi-arrow-down-circle', () => {
      expect(wrapper.find('ibiarrowdowncircle').exists()).toBe(true)
    })

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

    describe('default entry type FORM', () => {
      beforeEach(async () => {
        wrapper = createWrapper({
          amount: 100,
          date: '2021-05-02T17:20:11+00:00',
          comment: 'This is a comment',
          factor: 17,
          gdt: 1700,
          id: 42,
        })
      })

      it('has the heart icon', () => {
        expect(wrapper.find('ibiheart').exists()).toBe(true)
      })

      it('has the description gdt.contribution', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('gdt.contribution')
      })

      it('renders the amount of euros', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('100 €')
      })

      it('renders the amount of GDT', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('1700 GDT')
      })

      describe('without comment', () => {
        it('does not render the message row', async () => {
          await wrapper.setProps({ comment: undefined })
          expect(wrapper.findAll('div.row').at(1).text()).toContain('gdt.calculation')
        })
      })

      describe('collapse is open', () => {
        beforeEach(async () => {
          await wrapper.find('.list-group').trigger('click')
          await nextTick()
        })

        it('shows the collapse', () => {
          const collapse = wrapper.find('div#gdt-collapse-42')
          expect(collapse.exists()).toBe(true)
          expect(collapse.attributes('data-test')).toBe('collapse')
          expect(wrapper.find('[data-test="collapse"]').classes()).toContain('show')
        })
      })
    })

    describe('GdtEntryType.CVS', () => {
      it('behaves as default FORM', async () => {
        await wrapper.setProps({ gdtEntryType: 'CVS' })
        expect(wrapper.find('ibiheart').exists()).toBe(true)
      })
    })

    describe('GdtEntryType.ELOPAGE', () => {
      it('behaves as default FORM', async () => {
        await wrapper.setProps({ gdtEntryType: 'ELOPAGE' })
        expect(wrapper.find('ibiheart').exists()).toBe(true)
      })
    })

    describe('GdtEntryType.DIGISTORE', () => {
      it('behaves as default FORM', async () => {
        await wrapper.setProps({ gdtEntryType: 'DIGISTORE' })
        expect(wrapper.find('ibiheart').exists()).toBe(true)
      })
    })

    describe('GdtEntryType.CVS2', () => {
      it('behaves as default FORM', async () => {
        await wrapper.setProps({ gdtEntryType: 'CVS2' })
        expect(wrapper.find('ibiheart').exists()).toBe(true)
      })
    })

    describe('GdtEntryType.ELOPAGE_PUBLISHER', () => {
      beforeEach(async () => {
        wrapper = createWrapper({
          amount: 365.67,
          date: '2020-04-10T13:28:00+00:00',
          comment: 'This is a comment',
          gdtEntryType: 'ELOPAGE_PUBLISHER',
          factor: 22,
          gdt: 967.65,
          id: 42,
        })
      })

      it('has the person-check icon', () => {
        expect(wrapper.find('ibipersoncheck').exists()).toBe(true)
      })

      it('has the description gdt.recruited-member', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('gdt.recruited-member')
      })

      it('renders the percentage', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('5%')
      })

      it('renders the amount of GDT', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('365.67 GDT')
      })
    })

    describe('GdtEntryType.GLOBAL_MODIFICATOR', () => {
      beforeEach(async () => {
        wrapper = createWrapper({
          amount: 123.45,
          date: '2020-03-12T13:28:00+00:00',
          comment: 'This is a comment',
          gdtEntryType: 'GLOBAL_MODIFICATOR',
          factor: 19,
          gdt: 61.23,
          id: 42,
        })
      })

      it('has the gift icon', () => {
        expect(wrapper.find('ibigift').exists()).toBe(true)
      })

      it('has the description gdt.gdt-received', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('gdt.gdt-received')
      })

      it('renders the comment', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('This is a comment')
      })

      it('renders the amount of GDT', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('61.23 GDT')
      })
    })
  })
})
