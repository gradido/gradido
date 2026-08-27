import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionForm from './TransactionForm'
import { nextTick, ref } from 'vue'
import { SEND_TYPES } from '@/utils/sendTypes'
import {
  BCard,
  BForm,
  // BFormRadioGroup,
  BRow,
  BCol,
  // BFormRadio,
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
          // BFormRadioGroup,
          BRow,
          BCol,
          // BFormRadio,
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

  describe('send type from the route', () => {
    it('opens in e-mail mode when ?art=email', () => {
      useRoute.mockReturnValueOnce({ params: {}, query: { art: 'email' } })
      const w = createWrapper({ balance: 100 })
      expect(w.vm.radioSelected).toBe(SEND_TYPES.email)
    })

    it('keeps the default for any other art value', () => {
      useRoute.mockReturnValueOnce({ params: {}, query: { art: 'nonsense' } })
      const w = createWrapper({ balance: 100 })
      expect(w.vm.radioSelected).toBe(SEND_TYPES.send)
    })
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
        wrapper.vm.radioSelected = SEND_TYPES.send
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
          wrapper.vm.radioSelected = SEND_TYPES.email
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
        wrapper.vm.radioSelected = SEND_TYPES.send
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

    // What the Gradido card prints is `host/u/alias`; the copy button in the wallet adds
    // the scheme. Both have to be typeable here, or the printed line is only decoration.
    describe('a Gradido address in the recipient field', () => {
      // url is the federation endpoint, because that is what the database stores -- the
      // whole reason a bare host never used to find its community.
      const home = {
        uuid: 'uuid-home',
        name: 'KI Playground',
        url: 'https://ki-playground.gradido.net/api/',
        foreign: false,
      }
      const other = {
        uuid: 'uuid-other',
        name: 'Gradido Entwicklung',
        url: 'http://localhost/api/',
        foreign: true,
      }

      const fillSend = (identifier) => {
        wrapper.vm.radioSelected = SEND_TYPES.send
        wrapper.vm.form.identifier = identifier
        wrapper.vm.form.amount = '10,00'
        wrapper.vm.form.memo = 'Danke Dir sehr'
      }

      beforeEach(async () => {
        wrapper = createWrapper({ balance: 100.0 })
        await nextTick()
        wrapper.vm.setCommunities([home, other])
      })

      it('finds the community behind the printed host', async () => {
        fillSend('ki-playground.gradido.net/u/Bernd')
        await nextTick()
        expect(wrapper.vm.formIsInvalid).toBe(false)
      })

      it('finds it with the scheme the copy button adds', async () => {
        fillSend('https://ki-playground.gradido.net/u/Bernd')
        await nextTick()
        expect(wrapper.vm.formIsInvalid).toBe(false)
      })

      // Visible on screen: the community above the field switches by itself and turns
      // into plain text. Without it the right address stands in the field and the wrong
      // community above it.
      it('pulls the community up into the switch', async () => {
        fillSend('ki-playground.gradido.net/u/Bernd')
        await nextTick()
        expect(wrapper.vm.form.targetCommunity).toEqual(home)
        expect(wrapper.vm.autoCommunityIdentifier).toBe('uuid-home')
      })

      it('sends on the bare user name and the community it named', async () => {
        fillSend('https://ki-playground.gradido.net/u/Bernd')
        await nextTick()
        await wrapper.findComponent(BForm).trigger('submit.prevent')
        expect(wrapper.emitted('set-transaction')[0][0]).toEqual(
          expect.objectContaining({ identifier: 'Bernd', targetCommunity: home }),
        )
      })

      it('refuses a community it cannot reach', async () => {
        fillSend('irgendwo.example/u/Bernd')
        await nextTick()
        expect(wrapper.vm.formIsInvalid).toBe(true)
      })

      // The namespace has to mean something here too -- a group must not arrive at the
      // send form as if it were a person.
      it('refuses a namespace that is not a person', async () => {
        fillSend('ki-playground.gradido.net/g/Wandergruppe')
        await nextTick()
        expect(wrapper.vm.formIsInvalid).toBe(true)
      })

      it('leaves the shapes that already worked alone', async () => {
        fillSend('Gradido Entwicklung/Bernd')
        await nextTick()
        expect(wrapper.vm.formIsInvalid).toBe(false)
        expect(wrapper.vm.form.targetCommunity).toEqual(other)
      })

      // The e-mail tab used to emit the whole string as the user name, because the
      // splitting sat in the else branch alone. Nobody was ever reached that way.
      it('sends an e-mail on the bare user name too', async () => {
        wrapper.vm.radioSelected = SEND_TYPES.email
        wrapper.vm.form.subject = 'Ein Gruss'
        wrapper.vm.form.memo = 'Danke Dir sehr'
        wrapper.vm.form.identifier = 'ki-playground.gradido.net/u/Bernd'
        await nextTick()
        await wrapper.findComponent(BForm).trigger('submit.prevent')
        expect(wrapper.emitted('send-email')[0][0]).toEqual(
          expect.objectContaining({ identifier: 'Bernd', targetCommunity: home }),
        )
      })

      // The check used to stand twice, word for word. This is the test that notices if
      // one copy comes back.
      it('applies the same check on the e-mail tab', async () => {
        wrapper.vm.radioSelected = SEND_TYPES.email
        wrapper.vm.form.subject = 'Ein Gruss'
        wrapper.vm.form.memo = 'Danke Dir sehr'
        wrapper.vm.form.identifier = 'ki-playground.gradido.net/u/Bernd'
        await nextTick()
        expect(wrapper.vm.formIsInvalid).toBe(false)

        wrapper.vm.form.identifier = 'irgendwo.example/u/Bernd'
        await nextTick()
        expect(wrapper.vm.formIsInvalid).toBe(true)
      })
    })

    describe.skip('create transaction link', () => {
      beforeEach(async () => {
        wrapper.vm.radioSelected = SEND_TYPES.link
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

  // The same textarea serves both send types, but the two are bound by different
  // rules: a memo travels with a transaction into a varchar(512) column, a message
  // does not. Sending the message down the memo rules would cut a normal first
  // contact short, sending the memo down the message rules would let it grow past
  // the column it has to fit.
  describe('length rules per send type', () => {
    const longerThanAMemo = 'x'.repeat(1000)
    const shortReply = 'Ja'

    beforeEach(async () => {
      useRoute.mockReturnValue({ params: {}, query: {} })
      wrapper = createWrapper({ balance: 100.0 })
      await nextTick()
    })

    it('lets a message be far longer than a memo may be', async () => {
      wrapper.vm.radioSelected = SEND_TYPES.email
      await nextTick()
      expect(wrapper.vm.validationSchema.fields.memo.isValidSync(longerThanAMemo)).toBe(true)
    })

    it('lets a message be as short as a two letter reply', async () => {
      wrapper.vm.radioSelected = SEND_TYPES.email
      await nextTick()
      expect(wrapper.vm.validationSchema.fields.memo.isValidSync(shortReply)).toBe(true)
    })

    it('keeps a transaction memo inside the bounds of its column', async () => {
      wrapper.vm.radioSelected = SEND_TYPES.send
      await nextTick()
      expect(wrapper.vm.validationSchema.fields.memo.isValidSync(longerThanAMemo)).toBe(false)
      expect(wrapper.vm.validationSchema.fields.memo.isValidSync(shortReply)).toBe(false)
    })
  })
})
