import { mount } from '@vue/test-utils'
import TransactionForm from './TransactionForm'
import flushPromises from 'flush-promises'

const localVue = global.localVue

describe('GddSend', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $n: jest.fn((n) => String(n)),
    $store: {
      state: {
        email: 'user@example.org',
      },
    },
  }

  const propsData = {
    balance: 100.0,
  }

  const Wrapper = () => {
    return mount(TransactionForm, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.transaction-form').exists()).toBeTruthy()
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
          expect(wrapper.find('label.input-1').text()).toBe('form.recipient')
        })

        it('has a placeholder "E-Mail"', () => {
          expect(wrapper.find('#input-group-1').find('input').attributes('placeholder')).toBe(
            'E-Mail',
          )
        })

        it('flushes an error message when no valid email is given', async () => {
          await wrapper.find('#input-group-1').find('input').setValue('a')
          await flushPromises()
          expect(wrapper.find('span.errors').text()).toBe('validations.messages.email')
        })

        it('trims the email after blur', async () => {
          await wrapper.find('#input-group-1').find('input').setValue('  valid@email.com  ')
          await flushPromises()
          expect(wrapper.vm.form.email).toBe('valid@email.com')
        })
      })

      describe('ammount field', () => {
        it('has an input field of type text', () => {
          expect(wrapper.find('#input-group-2').find('input').attributes('type')).toBe('text')
        })

        it('has an GDD text icon', () => {
          expect(wrapper.find('#input-group-2').find('div.m-1').text()).toBe('GDD')
        })

        it('has a label form.amount', () => {
          expect(wrapper.find('label.input-2').text()).toBe('form.amount')
        })

        it('has a placeholder "0.01"', () => {
          expect(wrapper.find('#input-group-2').find('input').attributes('placeholder')).toBe(
            '0.01',
          )
        })

        it('flushes an error message when no valid amount is given', async () => {
          await wrapper.find('#input-group-2').find('input').setValue('a')
          await flushPromises()
          expect(wrapper.find('span.errors').text()).toBe('form.validation.gddSendAmount')
        })

        it('flushes an error message when amount is too high', async () => {
          await wrapper.find('#input-group-2').find('input').setValue('123.34')
          await flushPromises()
          expect(wrapper.find('span.errors').text()).toBe('form.validation.gddSendAmount')
        })

        it('flushes no errors when amount is valid', async () => {
          await wrapper.find('#input-group-2').find('input').setValue('87.34')
          await flushPromises()
          expect(wrapper.find('span.errors').exists()).toBeFalsy()
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

        it('has a label form.message', () => {
          expect(wrapper.find('label.input-3').text()).toBe('form.message')
        })

        it('flushes an error message when memo is less than 5 characters', async () => {
          await wrapper.find('#input-group-3').find('textarea').setValue('a')
          await flushPromises()
          expect(wrapper.find('span.errors').text()).toBe('validations.messages.min')
        })

        it('flushes no error message when memo is valid', async () => {
          await wrapper.find('#input-group-3').find('textarea').setValue('Long enough')
          await flushPromises()
          expect(wrapper.find('span.errors').exists()).toBeFalsy()
        })
      })

      describe('cancel button', () => {
        it('has a cancel button', () => {
          expect(wrapper.find('button[type="reset"]').exists()).toBeTruthy()
        })

        it('has the text "form.cancel"', () => {
          expect(wrapper.find('button[type="reset"]').find('svg').attributes('aria-label')).toBe('trash')
        })

        it('clears all fields on click', async () => {
          await wrapper.find('#input-group-1').find('input').setValue('someone@watches.tv')
          await wrapper.find('#input-group-2').find('input').setValue('87.23')
          await wrapper.find('#input-group-3').find('textarea').setValue('Long enugh')
          await flushPromises()
          expect(wrapper.vm.form.email).toBe('someone@watches.tv')
          expect(wrapper.vm.form.amount).toBe('87.23')
          expect(wrapper.vm.form.memo).toBe('Long enugh')
          await wrapper.find('button[type="reset"]').trigger('click')
          await flushPromises()
          expect(wrapper.vm.form.email).toBe('')
          expect(wrapper.vm.form.amount).toBe('')
          expect(wrapper.vm.form.memo).toBe('')
        })
      })

      describe('submit', () => {
        beforeEach(async () => {
          await wrapper.find('#input-group-1').find('input').setValue('someone@watches.tv')
          await wrapper.find('#input-group-2').find('input').setValue('87.23')
          await wrapper.find('#input-group-3').find('textarea').setValue('Long enugh')
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('emits set-transaction', async () => {
          expect(wrapper.emitted('set-transaction')).toBeTruthy()
          expect(wrapper.emitted('set-transaction')).toEqual([
            [
              {
                email: 'someone@watches.tv',
                amount: 87.23,
                memo: 'Long enugh',
              },
            ],
          ])
        })
      })
    })
  })
})
