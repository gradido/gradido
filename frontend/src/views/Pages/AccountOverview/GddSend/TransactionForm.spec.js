import { mount } from '@vue/test-utils'
import TransactionForm from './TransactionForm'

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

  const Wrapper = () => {
    return mount(TransactionForm, { localVue, mocks })
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
          expect(wrapper.find('label.input-1').text()).toBe('form.receiver')
        })

        it('has a placeholder "E-Mail"', () => {
          expect(wrapper.find('#input-group-1').find('input').attributes('placeholder')).toBe(
            'E-Mail',
          )
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
          expect(wrapper.find('label.input-3').text()).toBe('form.memo')
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
