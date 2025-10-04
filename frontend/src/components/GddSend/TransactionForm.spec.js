import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionForm from './TransactionForm'
import { nextTick, ref } from 'vue'
import { SEND_TYPES } from '@/utils/sendTypes'
import {
  BCard,
  BForm,
  BFormRadioGroup,
  BRow,
  BCol,
  BFormRadio,
  BButton,
  BFormInvalidFeedback,
} from 'bootstrap-vue-next'
import { useRoute } from 'vue-router'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
  })),
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
  })),
}))

const mockUseQuery = vi.fn()
const mockUseLazyQuery = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (...args) => {
    mockUseQuery(...args)
    return {
      result: ref(null),
      loading: ref(false),
      error: ref(null),
    }
  },
  useLazyQuery: (...args) => {
    mockUseLazyQuery(...args)
    return {
      refetch: vi.fn(() => true),
    }
  },
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: vi.fn(),
  })),
}))

describe('TransactionForm', () => {
  let wrapper

  const mockT = vi.fn((key) => key)
  const mockN = vi.fn((n) => String(n))

  const createWrapper = (props = {}) => {
    return mount(TransactionForm, {
      global: {
        mocks: {
          $t: mockT,
          $n: mockN,
          $i18n: {
            locale: 'en',
          },
        },
        components: {
          BCard,
          BForm,
          BFormRadioGroup,
          BRow,
          BCol,
          BFormRadio,
          BButton,
          BFormInvalidFeedback,
        },
        stubs: {
          'community-switch': true,
          'validated-input': true,
        },
      },
      props: {
        balance: 0.0,
        ...props,
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.transaction-form').exists()).toBe(true)
  })

  describe('with balance <= 0.00 GDD the form is disabled', () => {
    it('has a disabled input field of type text', () => {
      expect(wrapper.find('#identifier').attributes('disabled')).toBe('true')
    })

    it('has a disabled input field for amount', () => {
      expect(wrapper.find('#amount').attributes('disabled')).toBe('true')
    })

    it('has a disabled textarea field', () => {
      expect(wrapper.find('#memo').attributes('disabled')).toBe('true')
    })

    it('has a message indicating that there are no GDDs to send', () => {
      expect(wrapper.find('.text-danger').text()).toBe('form.no_gdd_available')
    })

    it('has no reset button and no submit button', () => {
      expect(wrapper.find('.test-buttons').exists()).toBe(false)
    })
  })

  describe('with balance greater 0.00 (100.00) GDD the form is fully enabled', () => {
    beforeEach(async () => {
      wrapper = createWrapper({ balance: 100.0 })
      await nextTick()
    })

    it('has no warning message', () => {
      expect(wrapper.find('.text-danger').exists()).toBe(false)
    })

    describe('send GDD', () => {
      beforeEach(async () => {
        await wrapper.findComponent(BFormRadioGroup).setValue(SEND_TYPES.send)
      })

      it('has SEND_TYPES = send', () => {
        expect(wrapper.vm.radioSelected).toBe(SEND_TYPES.send)
      })

      describe('identifier field', () => {
        it('has an input field of type text', () => {
          expect(wrapper.find('#identifier').exists()).toBe(true)
        })

        it('has a label form.recipient', () => {
          expect(wrapper.find('#identifier').attributes('label')).toBe('form.recipient')
        })

        it('has a placeholder for identifier', () => {
          expect(wrapper.find('#identifier').attributes('placeholder')).toBe('form.identifier')
        })
      })

      describe('amount field', () => {
        it('has an input field of type text', () => {
          expect(wrapper.find('#amount').exists()).toBe(true)
        })

        it('has a label form.amount', () => {
          expect(wrapper.find('#amount').attributes('label')).toBe('form.amount')
        })

        it('has a placeholder "0.01"', () => {
          expect(wrapper.find('#amount').attributes('placeholder')).toBe('0.01')
        })
      })

      describe('message text box', () => {
        it('has a textarea field', () => {
          expect(wrapper.find('#memo').exists()).toBe(true)
        })

        it('has a label form.message', () => {
          expect(wrapper.find('#memo').attributes('label')).toBe('form.message')
        })
      })

      describe('cancel button', () => {
        it('has a cancel button', () => {
          expect(wrapper.find('button[type="reset"]').exists()).toBe(true)
        })

        it('has the text "form.reset"', () => {
          expect(wrapper.find('button[type="reset"]').text()).toBe('form.reset')
        })

        it.skip('resets the form when clicked', async () => {
          // Set some values in the form
          await wrapper.findComponent(BFormRadioGroup).setValue(SEND_TYPES.send)
          wrapper.vm.form.identifier = 'test@example.com'
          wrapper.vm.form.amount = '100,00'
          wrapper.vm.form.memo = 'Test memo'

          // Trigger the reset
          await wrapper.find('button[type="reset"]').trigger('click')

          // Check if the form has been reset
          expect(wrapper.vm.radioSelected).toBe(SEND_TYPES.send)
          expect(wrapper.vm.form.identifier).toBe('')
          expect(wrapper.vm.form.amount).toBe('')
          expect(wrapper.vm.form.memo).toBe('')
        })
      })

      describe('submit', () => {
        it('has a submit button', () => {
          expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
        })

        it('has the text "form.check_now"', () => {
          expect(wrapper.find('button[type="submit"]').text()).toBe('form.check_now')
        })

        it.skip('calls onSubmit when form is submitted', async () => {
          const submitSpy = vi.spyOn(wrapper.vm, 'onSubmit')
          await wrapper.findComponent(BForm).trigger('submit.prevent')
          expect(submitSpy).toHaveBeenCalled()
        })
      })
    })

    describe('form submission', () => {
      beforeEach(async () => {
        wrapper = createWrapper({ balance: 100.0 })
        await nextTick()
        await wrapper.findComponent(BFormRadioGroup).setValue(SEND_TYPES.send)
      })

      it('emits set-transaction event with correct data when form is submitted', async () => {
        wrapper.vm.form.identifier = 'test@example.com'
        wrapper.vm.form.amount = '100,00'
        wrapper.vm.form.memo = 'Test memo'
        await wrapper.findComponent(BForm).trigger('submit.prevent')
        expect(wrapper.emitted('set-transaction')).toBeTruthy()
        expect(wrapper.emitted('set-transaction')[0][0]).toEqual(
          expect.objectContaining({
            selected: SEND_TYPES.send,
            identifier: 'test@example.com',
            amount: 100.0,
            memo: 'Test memo',
          }),
        )
      })

      it('handles form submission with empty amount', async () => {
        wrapper = createWrapper({ balance: 100.0 })
        await nextTick()
        wrapper.vm.form.identifier = 'test@example.com'
        wrapper.vm.form.memo = 'Test memo'
        await wrapper.findComponent(BForm).trigger('submit.prevent')

        expect(wrapper.emitted('set-transaction')).toBeTruthy()
        expect(wrapper.emitted('set-transaction')[0][0]).toEqual(
          expect.objectContaining({
            selected: SEND_TYPES.send,
            identifier: 'test@example.com',
            amount: 0,
            memo: 'Test memo',
          }),
        )
      })
    })

    describe('create transaction link', () => {
      beforeEach(async () => {
        await wrapper.findComponent(BFormRadioGroup).setValue(SEND_TYPES.link)
      })

      it('has SEND_TYPES = link', () => {
        expect(wrapper.vm.radioSelected).toBe(SEND_TYPES.link)
      })

      it('has no input field for identifier', () => {
        expect(wrapper.find('input-identifier-stub').exists()).toBe(false)
      })
    })
  })

  describe('with gradido ID', () => {
    beforeEach(async () => {
      vi.mocked(useRoute).mockReturnValue({
        params: { userIdentifier: 'gradido-ID', communityIdentifier: 'community-ID' },
        query: {},
      })
      wrapper = createWrapper()
      await nextTick()
    })

    it('has no identifier input field', () => {
      expect(wrapper.find('input-identifier-stub').exists()).toBe(false)
    })

    it('passes correct variables to useQuery', () => {
      const queryVariables = mockUseQuery.mock.calls[0][1]
      expect(queryVariables).toBeDefined()
      expect(queryVariables()).toEqual({
        identifier: 'gradido-ID',
        communityIdentifier: 'community-ID',
      })
    })
  })
})
