import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import UserPassword from './UserPassword.vue'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import Vuex from 'vuex'
import { BButton, BCard, BCol, BForm, BRow } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'

vi.mock('vee-validate', () => {
  const useForm = vi.fn()
  const useField = vi.fn()
  return { useForm, useField }
})

vi.mock('@/components/Inputs/InputPassword', () => ({
  default: {
    name: 'InputPassword',
    template:
      '<input type="password" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'rules', 'label', 'name', 'placeholder'],
  },
}))

vi.mock('@/components/Inputs/InputPasswordConfirmation', () => ({
  default: {
    name: 'InputPasswordConfirmation',
    template: `
      <div>
        <div class="mb-2">
          <input-password
            id="new-password-input-field"
            :model-value="modelValue.newPassword"
            @update:model-value="updatePassword"
            :placeholder="register ? 'Password' : 'New Password'"
          />
        </div>
        <div class="mb-2">
          <input-password
            id="repeat-new-password-input-field"
            :model-value="modelValue.newPasswordRepeat"
            @update:model-value="updatePasswordRepeat"
            :placeholder="register ? 'Repeat Password' : 'Repeat New Password'"
          />
        </div>
        <div class="invalid-feedback">
          <span v-for="(message, index) in validationMessages" :key="index">{{ message }}</span>
        </div>
      </div>
    `,
    props: ['modelValue', 'register'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const updatePassword = (value) => {
        emit('update:modelValue', { ...props.modelValue, newPassword: value })
      }
      const updatePasswordRepeat = (value) => {
        emit('update:modelValue', { ...props.modelValue, newPasswordRepeat: value })
      }
      return { updatePassword, updatePasswordRepeat }
    },
    data() {
      return {
        validationMessages: [
          'validations.messages.required',
          'site.signup.lowercase',
          'site.signup.uppercase',
          'site.signup.one_number',
          'site.signup.minimum',
          'site.signup.special-char',
        ],
      }
    },
  },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'settings.password.change-password': 'Change Password',
      'message.reset': 'Password changed successfully',
    },
  },
})

const toastErrorMock = vi.fn()
const toastSuccessMock = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: toastErrorMock,
    toastSuccess: toastSuccessMock,
  }),
}))

const mutateMock = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mutateMock,
  }),
}))

describe('UserPassword', () => {
  let wrapper
  let store
  let formValues
  let setFieldValue
  let handleSubmit
  let resetForm

  const createVuexStore = () => {
    return new Vuex.Store({
      state: {},
      mutations: {},
      actions: {},
      getters: {},
    })
  }

  const mountComponent = () => {
    store = createVuexStore()
    return mount(UserPassword, {
      global: {
        components: {
          BCard,
          BRow,
          BCol,
          BButton,
          BForm,
        },
        plugins: [i18n, store],
        stubs: {
          IBiPencil: true,
          IBiXCircle: true,
        },
      },
    })
  }

  beforeEach(() => {
    formValues = {
      password: '',
      newPassword: '',
      newPasswordRepeat: '',
    }
    setFieldValue = vi.fn((field, value) => {
      formValues[field] = value
    })
    handleSubmit = vi.fn((callback) => () => callback(formValues))
    resetForm = vi.fn()

    vi.mocked(useForm).mockReturnValue({
      handleSubmit,
      values: formValues,
      setFieldValue,
      resetForm,
    })
    wrapper = mountComponent()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    expect(wrapper.find('#change_pwd').exists()).toBe(true)
  })

  it('has a change password button', () => {
    expect(wrapper.find('.change-password-form-opener').exists()).toBe(true)
  })

  it('has a change password button with text "Change Password"', () => {
    expect(wrapper.find('.change-password-form-opener').text()).toContain('Change Password')
  })

  it('has a change password button with a pencil icon', () => {
    expect(wrapper.find('.change-password-form-opener i-bi-pencil-stub').exists()).toBe(true)
  })

  describe('change password form', () => {
    beforeEach(async () => {
      await wrapper.find('.change-password-form-opener').trigger('click')
    })

    it('has a change password form', () => {
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('has a cancel button', () => {
      expect(wrapper.find('.change-password-form-opener i-bi-x-circle-stub').exists()).toBe(true)
    })

    it('closes the form when cancel button is clicked', async () => {
      await wrapper.find('.change-password-form-opener').trigger('click')
      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('has three input fields', () => {
      expect(wrapper.findAll('input[type="password"]')).toHaveLength(1)
      expect(wrapper.findAll('input-password')).toHaveLength(2)
    })

    it('has a submit button', () => {
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    describe('validation', () => {
      it('displays all password requirements', () => {
        const feedbackArray = wrapper.find('.invalid-feedback').findAll('span')
        expect(feedbackArray).toHaveLength(6)
        expect(feedbackArray[0].text()).toBe('validations.messages.required')
        expect(feedbackArray[1].text()).toBe('site.signup.lowercase')
        expect(feedbackArray[2].text()).toBe('site.signup.uppercase')
        expect(feedbackArray[3].text()).toBe('site.signup.one_number')
        expect(feedbackArray[4].text()).toBe('site.signup.minimum')
        expect(feedbackArray[5].text()).toBe('site.signup.special-char')
      })
    })

    describe('submit', () => {
      it('calls the mutation and shows success message on valid submission', async () => {
        mutateMock.mockResolvedValue({
          data: {
            updateUserData: {
              validValues: 1,
            },
          },
        })

        setFieldValue('password', 'oldPassword')
        setFieldValue('newPassword', 'NewPassword123!')
        setFieldValue('newPasswordRepeat', 'NewPassword123!')

        await wrapper.find('form').trigger('submit')
        await nextTick()

        expect(mutateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            password: 'oldPassword',
            passwordNew: 'NewPassword123!',
          }),
        )
        expect(toastSuccessMock).toHaveBeenCalledWith('Password changed successfully')
      })

      it('shows error message on failed submission', async () => {
        mutateMock.mockRejectedValue(new Error('Update failed'))

        setFieldValue('password', 'oldPassword')
        setFieldValue('newPassword', 'NewPassword123!')
        setFieldValue('newPasswordRepeat', 'NewPassword123!')

        await wrapper.find('form').trigger('submit')
        await nextTick()

        expect(toastErrorMock).toHaveBeenCalledWith('Update failed')
      })
    })
  })
})
