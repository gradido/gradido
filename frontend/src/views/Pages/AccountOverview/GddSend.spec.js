import { mount } from '@vue/test-utils'
import GddSend from './GddSend'
import Vuex from 'vuex'

const localVue = global.localVue

describe('GddSend', () => {
  let wrapper

  const state = {
    user: {
      balance: 1234,
      balance_gdt: 9876,
    },
  }

  const store = new Vuex.Store({
    state,
  })

  const mocks = {
    //    $n: jest.fn((n) => n),
    $t: jest.fn((t) => t),
    $moment: jest.fn((m) => ({
      format: () => m,
    })),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $n: jest.fn((n) => String(n)),
  }

  const Wrapper = () => {
    return mount(GddSend, { localVue, store, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdd-send').exists()).toBeTruthy()
    })

    describe('warning messages', () => {
      it('has a warning message', () => {
        expect(wrapper.find('div.alert-default').find('span').text()).toBe('form.attention')
      })
    })

    describe('transaction form', () => {
      describe('email field', () => {
        it('has an input field of type email', () => {
          expect(wrapper.find('#input-group-1').find('input').attributes('type')).toBe('email')
        })

        it('has an envelope icon', () => {
          expect(wrapper.find('#input-group-1').find('svg').attributes('aria-label')).toBe(
            'envelope',
          )
        })

        it('has a label form.receiver', () => {
          expect(wrapper.findAll('div.text-left').at(0).text()).toBe('form.receiver')
        })

        it('has a placeholder "E-Mail"', () => {
          expect(wrapper.find('#input-group-1').find('input').attributes('placeholder')).toBe(
            'E-Mail',
          )
        })
      })

      describe('ammount field', () => {
        it('has an input field of type number', () => {
          expect(wrapper.find('#input-group-2').find('input').attributes('type')).toBe('number')
        })

        it('has an GDD text icon', () => {
          expect(wrapper.find('#input-group-2').find('div.h3').text()).toBe('GDD')
        })

        it('has a label form.amount', () => {
          expect(wrapper.findAll('div.text-left').at(1).text()).toBe('form.amount')
        })

        it('has a placeholder "0.01"', () => {
          expect(wrapper.find('#input-group-2').find('input').attributes('placeholder')).toBe(
            '0.01',
          )
        })
      })

      describe('message text box', () => {
        it('has an textarea field', () => {
          expect(wrapper.find('#input-group-3').find('textarea').exists()).toBeTruthy()
        })

        it('has an chat-right-text icon', () => {
          expect(wrapper.find('#input-group-3').find('svg').attributes('aria-label')).toBe(
            'chat right text',
          )
        })

        it('has a label form.memo', () => {
          expect(wrapper.findAll('div.text-left').at(2).text()).toBe('form.memo')
        })
      })

      describe('cancel button', () => {
        it('has a cancel button', () => {
          expect(wrapper.find('button[type="reset"]').exists()).toBeTruthy()
        })

        it('has the text "form.cancel"', () => {
          expect(wrapper.find('button[type="reset"]').text()).toBe('form.reset')
        })

        it.skip('clears the email field on click', async () => {
          wrapper.find('#input-group-1').find('input').setValue('someone@watches.tv')
          wrapper.find('button[type="reset"]').trigger('click')
          await wrapper.vm.$nextTick()
          expect(wrapper.vm.form.email).toBeNull()
        })
      })
    })
  })
})
