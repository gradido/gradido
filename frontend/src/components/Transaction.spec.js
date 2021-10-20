import { mount } from '@vue/test-utils'
import Transaction from './Transaction'
import Vue from 'vue'

// disable throwing Errors on warnings to catch the warning
Vue.config.warnHandler = (w) => {
}

const localVue = global.localVue

const consoleError = console.error
const consoleErrorMock = jest.fn()
console.error = consoleErrorMock


/*
      gdtEntries: [
        {
          amount: 100,
          gdt: 1700,
          factor: 17,
          comment: '',
          date: '2021-05-02T17:20:11+00:00',
          gdtEntryType: GdtEntryType.FORM,
        },
        {
          amount: 1810,
          gdt: 362,
          factor: 0.2,
          comment: 'Dezember 20',
          date: '2020-12-31T12:00:00+00:00',
          gdtEntryType: GdtEntryType.GLOBAL_MODIFICATOR,
        },
        {
          amount: 100,
          gdt: 1700,
          factor: 17,
          comment: '',
          date: '2020-05-07T17:00:00+00:00',
          gdtEntryType: GdtEntryType.FORM,
        },
        {
          amount: 100,
          gdt: 110,
          factor: 22,
          comment: '',
          date: '2020-04-10T13:28:00+00:00',
          gdtEntryType: GdtEntryType.ELOPAGE_PUBLISHER,
        },
      ],
*/

describe('Transaction', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
    $d: jest.fn((d) => d),
  }

  const Wrapper = () => {
    return mount(Transaction, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-list-item').exists()).toBeTruthy()
    })

    describe('no valid GDT entry type', () => {
      beforeEach(async () => {
        await wrapper.setProps({ gdtEntryType: 'NOT_VALID'  })
      })
      
      it('throws an error', () => {
        expect(consoleErrorMock).toBeCalledWith(expect.objectContaining({ message: 'no lines for this type: NOT_VALID' }))
      })
    })

    describe('default entry type FORM', () => {
      beforeEach((async ()
      it('has the heart icon', () => {
        console.log(wrapper.html())
        expect(wrapper.vm.getLinesByType.icon).toBe('heart')
      })
    })
  })
})
