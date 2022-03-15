import { mount } from '@vue/test-utils'
import Transaction from './Transaction'
import Vue from 'vue'

const localVue = global.localVue

const consoleErrorMock = jest.fn()

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

    it('has a collapse icon bi-caret-down-square', () => {
      expect(wrapper.find('div.gdt-transaction-list-item').findAll('svg').at(1).classes()).toEqual([
        'bi-caret-down-square',
        'b-icon',
        'bi',
        'text-muted',
      ])
    })

    describe('no valid GDT entry type', () => {
      beforeEach(async () => {
        // disable throwing Errors on warnings to catch the warning
        Vue.config.warnHandler = (w) => {}
        // eslint-disable-next-line no-console
        console.error = consoleErrorMock
        await wrapper.setProps({ gdtEntryType: 'NOT_VALID' })
      })

      it('throws an error', () => {
        expect(consoleErrorMock).toBeCalledWith(
          expect.objectContaining({ message: 'no lines for this type: NOT_VALID' }),
        )
      })
    })

    describe('default entry type FORM', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          amount: 100,
          date: '2021-05-02T17:20:11+00:00',
          comment: 'This is a comment',
          factor: 17,
          gdt: 1700,
          id: 42,
        })
      })

      it('has the heart icon', () => {
        expect(wrapper.find('svg.bi-heart').exists()).toBeTruthy()
      })

      it('has the description gdt.contribution', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('gdt.contribution')
      })

      it('renders the amount of euros', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('100 €')
      })

      it('renders the amount of GDT', () => {
        expect(wrapper.findAll('div.row').at(1).text()).toContain('1700 GDT')
      })

      it('renders the comment message', () => {
        expect(wrapper.findAll('div.row').at(2).text()).toContain('This is a comment')
      })

      it('renders the date', () => {
        expect(wrapper.findAll('div.row').at(3).text()).toContain('Sun May 02 2021')
      })

      it('does not show the collapse by default', () => {
        expect(wrapper.find('div#gdt-collapse-42').isVisible()).toBeFalsy()
      })

      describe('without comment', () => {
        it('does not render the message row', async () => {
          await wrapper.setProps({ comment: undefined })
          expect(wrapper.findAll('div.row').at(2).text()).toContain('form.date')
        })
      })
      /* how to open the collapse ????? 
      describe('collapse is open', () => {
        beforeEach(async () => {
          //console.log(wrapper.html())
          await wrapper.find('div#gdt-collapse-42').trigger('click')
          await wrapper.vm.$nextTick()
          await flushPromises()
          await wrapper.vm.$nextTick()
          await flushPromises()
          //console.log(wrapper.find('[enteractiveclass="collapsing"]').html())
        })

        it('shows the collapse', () => {
          //console.log(wrapper.html())
          expect(wrapper.find('div#gdt-collapse-42').isVisible()).toBeTruthy()
        })
      })
      */
    })

    describe('GdtEntryType.CVS', () => {
      it('behaves as default FORM', async () => {
        await wrapper.setProps({ gdtEntryType: 'CVS' })
        expect(wrapper.find('svg.bi-heart').exists()).toBeTruthy()
      })
    })

    describe('GdtEntryType.ELOPAGE', () => {
      it('behaves as default FORM', async () => {
        await wrapper.setProps({ gdtEntryType: 'ELOPAGE' })
        expect(wrapper.find('svg.bi-heart').exists()).toBeTruthy()
      })
    })

    describe('GdtEntryType.DIGISTORE', () => {
      it('behaves as default FORM', async () => {
        await wrapper.setProps({ gdtEntryType: 'DIGISTORE' })
        expect(wrapper.find('svg.bi-heart').exists()).toBeTruthy()
      })
    })

    describe('GdtEntryType.CVS2', () => {
      it('behaves as default FORM', async () => {
        await wrapper.setProps({ gdtEntryType: 'CVS2' })
        expect(wrapper.find('svg.bi-heart').exists()).toBeTruthy()
      })
    })

    describe('GdtEntryType.ELOPAGE_PUBLISHER', () => {
      beforeEach(async () => {
        await wrapper.setProps({
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
        expect(wrapper.find('svg.bi-person-check').exists()).toBeTruthy()
      })

      it('has the description gdt.recruited-member', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('gdt.recruited-member')
      })

      it('renders the percentage', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('5%')
      })

      it('renders the amount of GDT', () => {
        expect(wrapper.findAll('div.row').at(1).text()).toContain('365.67 GDT')
      })

      it('renders the comment message', () => {
        expect(wrapper.findAll('div.row').at(2).text()).toContain('This is a comment')
      })

      it('renders the date', () => {
        expect(wrapper.findAll('div.row').at(3).text()).toContain('Fri Apr 10 2020')
      })

      it('does not show the collapse by default', () => {
        expect(wrapper.find('div#gdt-collapse-42').isVisible()).toBeFalsy()
      })

      describe('without comment', () => {
        it('does not render the message row', async () => {
          await wrapper.setProps({ comment: undefined })
          expect(wrapper.findAll('div.row').at(2).text()).toContain('form.date')
        })
      })
    })

    describe('GdtEntryType.GLOBAL_MODIFICATOR', () => {
      beforeEach(async () => {
        await wrapper.setProps({
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
        expect(wrapper.find('svg.bi-gift').exists()).toBeTruthy()
      })

      it('has the description gdt.gdt-received', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('gdt.gdt-received')
      })

      it('renders the comment', () => {
        expect(wrapper.findAll('div.row').at(0).text()).toContain('This is a comment')
      })

      it('renders the amount of GDT', () => {
        expect(wrapper.findAll('div.row').at(1).text()).toContain('61.23 GDT')
      })

      it('renders the date', () => {
        expect(wrapper.findAll('div.row').at(2).text()).toContain('Thu Mar 12 2020')
      })

      it('does not show the collapse by default', () => {
        expect(wrapper.find('div#gdt-collapse-42').isVisible()).toBeFalsy()
      })
    })
  })
})
