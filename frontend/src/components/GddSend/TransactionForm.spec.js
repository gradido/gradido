import { mount } from '@vue/test-utils'
import TransactionForm from './TransactionForm'
import flushPromises from 'flush-promises'
import { SEND_TYPES } from '@/pages/Send'
import DashboardLayout from '@/layouts/DashboardLayout'

const localVue = global.localVue

describe('TransactionForm', () => {
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
    $route: {
      params: {},
    },
  }

  const propsData = {
    balance: 0.0,
  }

  const Wrapper = () => {
    return mount(TransactionForm, {
      localVue,
      mocks,
      propsData,
      provide: DashboardLayout.provide,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.transaction-form').exists()).toBe(true)
    })

    describe('with balance <= 0.00 GDD the form is disabled', () => {
      it('has a disabled input field of type email', () => {
        expect(
          wrapper.find('div[data-test="input-email"]').find('input').attributes('disabled'),
        ).toBe('disabled')
      })

      it('has a disabled input field for amount', () => {
        expect(
          wrapper.find('div[data-test="input-amount"]').find('input').attributes('disabled'),
        ).toBe('disabled')
      })

      it('has a disabled textarea field ', () => {
        expect(
          wrapper.find('div[data-test="input-textarea').find('textarea').attributes('disabled'),
        ).toBe('disabled')
      })

      it('has a message indicating that there are no GDDs to send ', () => {
        expect(wrapper.find('form').find('.text-danger').text()).toBe('form.no_gdd_available')
      })

      it('has no reset button and no submit button ', () => {
        expect(wrapper.find('.test-buttons').exists()).toBe(false)
      })
    })

    describe('with balance greater 0.00 (100.00) GDD the form is fully enabled', () => {
      beforeEach(() => {
        wrapper.setProps({ balance: 100.0 })
      })

      it('has no warning message ', () => {
        expect(wrapper.find('form').find('.text-danger').exists()).toBe(false)
      })

      describe('send GDD', () => {
        beforeEach(async () => {
          await wrapper.findAll('input[type="radio"]').at(0).setChecked()
        })

        it('has SEND_TYPES = send', () => {
          expect(wrapper.vm.radioSelected).toBe(SEND_TYPES.send)
        })

        describe('email field', () => {
          it('has an input field of type email', () => {
            expect(
              wrapper.find('div[data-test="input-email"]').find('input').attributes('type'),
            ).toBe('email')
          })

          it('has a label form.receiver', () => {
            expect(wrapper.find('div[data-test="input-email"]').find('label').text()).toBe(
              'form.recipient',
            )
          })

          it('has a placeholder "E-Mail"', () => {
            expect(
              wrapper.find('div[data-test="input-email"]').find('input').attributes('placeholder'),
            ).toBe('form.email')
          })

          it('flushes an error message when no valid email is given', async () => {
            await wrapper.find('div[data-test="input-email"]').find('input').setValue('a')
            await flushPromises()
            expect(
              wrapper.find('div[data-test="input-email"]').find('.invalid-feedback').text(),
            ).toBe('validations.messages.email')
          })

          // TODO:SKIPPED there is no check that the email being sent to is the same as the user's email.
          it.skip('flushes an error message when email is the email of logged in user', async () => {
            await wrapper
              .find('div[data-test="input-email"]')
              .find('input')
              .setValue('user@example.org')
            await flushPromises()
            expect(
              wrapper.find('div[data-test="input-email"]').find('.invalid-feedback').text(),
            ).toBe('form.validation.is-not')
          })

          it('trims the email after blur', async () => {
            await wrapper
              .find('div[data-test="input-email"]')
              .find('input')
              .setValue('  valid@email.com  ')
            await wrapper.find('div[data-test="input-email"]').find('input').trigger('blur')
            await flushPromises()
            expect(wrapper.vm.form.email).toBe('valid@email.com')
          })
        })

        describe('amount field', () => {
          it('has an input field of type text', () => {
            expect(
              wrapper.find('div[data-test="input-amount"]').find('input').attributes('type'),
            ).toBe('text')
          })

          it('has a label form.amount', () => {
            expect(wrapper.find('div[data-test="input-amount"]').find('label').text()).toBe(
              'form.amount',
            )
          })

          it('has a placeholder "0.01"', () => {
            expect(
              wrapper.find('div[data-test="input-amount"]').find('input').attributes('placeholder'),
            ).toBe('0.01')
          })

          it.skip('does not update form amount when invalid', async () => {
            await wrapper.find('div[data-test="input-amount"]').find('input').setValue('invalid')
            await wrapper.find('div[data-test="input-amount"]').find('input').trigger('blur')
            await flushPromises()
            expect(wrapper.vm.form.amount).toBe(0)
          })

          it('flushes an error message when no valid amount is given', async () => {
            await wrapper.find('div[data-test="input-amount"]').find('input').setValue('a')
            await flushPromises()
            expect(
              wrapper.find('div[data-test="input-amount"]').find('.invalid-feedback').text(),
            ).toBe('form.validation.gddSendAmount')
          })

          it('flushes an error message when amount is too high', async () => {
            await wrapper.find('div[data-test="input-amount"]').find('input').setValue('123.34')
            await flushPromises()
            expect(
              wrapper.find('div[data-test="input-amount"]').find('.invalid-feedback').text(),
            ).toBe('form.validation.gddSendAmount')
          })

          it('flushes no errors when amount is valid', async () => {
            await wrapper.find('div[data-test="input-amount"]').find('input').setValue('87.34')
            await flushPromises()
            expect(
              wrapper
                .find('div[data-test="input-amount"]')
                .find('.invalid-feedback')
                .attributes('aria-live'),
            ).toBe('off')
          })
        })

        describe('message text box', () => {
          it('has an textarea field', () => {
            expect(wrapper.find('div[data-test="input-textarea').find('textarea').exists()).toBe(
              true,
            )
          })

          it('has a label form.message', () => {
            expect(wrapper.find('div[data-test="input-textarea').find('label').text()).toBe(
              'form.message',
            )
          })

          it('flushes an error message when memo is less than 5 characters', async () => {
            await wrapper.find('div[data-test="input-textarea').find('textarea').setValue('a')
            await flushPromises()
            expect(
              wrapper.find('div[data-test="input-textarea').find('.invalid-feedback').text(),
            ).toBe('validations.messages.min')
          })

          it('flushes an error message when memo is more than 255 characters', async () => {
            await wrapper.find('div[data-test="input-textarea').find('textarea').setValue(`
Es ist ein König in Thule, der trinkt
Champagner, es geht ihm nichts drüber;
Und wenn er seinen Champagner trinkt,
Dann gehen die Augen ihm über.

Die Ritter sitzen um ihn her,
Die ganze Historische Schule;
Ihm aber wird die Zunge schwer,
Es lallt der König von Thule:

„Als Alexander, der Griechenheld,
Mit seinem kleinen Haufen
Erobert hatte die ganze Welt,
Da gab er sich ans Saufen.

Ihn hatten so durstig gemacht der Krieg
Und die Schlachten, die er geschlagen;
Er soff sich zu Tode nach dem Sieg,
Er konnte nicht viel vertragen.

Ich aber bin ein stärkerer Mann
Und habe mich klüger besonnen:
Wie jener endete, fang ich an,
Ich hab mit dem Trinken begonnen.

Im Rausche wird der Heldenzug
Mir später weit besser gelingen;
Dann werde ich, taumelnd von Krug zu Krug,
Die ganze Welt bezwingen.“`)
            await flushPromises()
            expect(
              wrapper.find('div[data-test="input-textarea').find('.invalid-feedback').text(),
            ).toBe('validations.messages.max')
          })

          it('flushes no error message when memo is valid', async () => {
            await wrapper
              .find('div[data-test="input-textarea')
              .find('textarea')
              .setValue('Long enough')
            await flushPromises()
            expect(
              wrapper
                .find('div[data-test="input-amount"]')
                .find('.invalid-feedback')
                .attributes('aria-live'),
            ).toBe('off')
          })
        })

        describe('cancel button', () => {
          it('has a cancel button', () => {
            expect(wrapper.find('button[type="reset"]').exists()).toBe(true)
          })

          it('has the text "form.reset"', () => {
            expect(wrapper.find('button[type="reset"]').text()).toBe('form.reset')
          })

          it('clears all fields on click', async () => {
            await wrapper
              .find('div[data-test="input-email"]')
              .find('input')
              .setValue('someone@watches.tv')
            await wrapper.find('div[data-test="input-amount"]').find('input').setValue('87.23')
            await wrapper
              .find('div[data-test="input-textarea')
              .find('textarea')
              .setValue('Long enough')
            await flushPromises()
            expect(wrapper.vm.form.email).toBe('someone@watches.tv')
            expect(wrapper.vm.form.amount).toBe('87.23')
            expect(wrapper.vm.form.memo).toBe('Long enough')
            await wrapper.find('button[type="reset"]').trigger('click')
            await flushPromises()
            expect(wrapper.vm.form.email).toBe('')
            expect(wrapper.vm.form.amount).toBe('')
            expect(wrapper.vm.form.memo).toBe('')
          })
        })

        describe('submit', () => {
          beforeEach(async () => {
            await wrapper
              .find('div[data-test="input-email"]')
              .find('input')
              .setValue('someone@watches.tv')
            await wrapper.find('div[data-test="input-amount"]').find('input').setValue('87.23')
            await wrapper
              .find('div[data-test="input-textarea')
              .find('textarea')
              .setValue('Long enough')
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
                  memo: 'Long enough',
                  selected: 'send',
                },
              ],
            ])
          })
        })
      })

      describe('create transaction link', () => {
        beforeEach(async () => {
          await wrapper.findAll('input[type="radio"]').at(1).setChecked()
        })

        it('has SEND_TYPES = link', () => {
          expect(wrapper.vm.radioSelected).toBe(SEND_TYPES.link)
        })

        it('has no input field of id input-group-1', () => {
          expect(wrapper.find('#input-group-1').exists()).toBe(false)
        })
      })
    })
  })
})
