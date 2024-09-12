import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UserName from './UserName.vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'

vi.mock('@/components/Inputs/InputUsername', () => ({
  default: {
    name: 'InputUsername',
    template: '<div></div>',
  },
}))

vi.mock('bootstrap-vue-next', () => ({
  BRow: { template: '<div><slot></slot></div>' },
  BCol: { template: '<div><slot></slot></div>' },
  BFormInput: { template: '<input />' },
  BFormGroup: { template: '<div><slot></slot></div>' },
  BForm: { template: '<form><slot></slot></form>' },
  BButton: { template: '<button><slot></slot></button>' },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'settings.username.no-username': 'No username set',
      'settings.username.change-success': 'Username changed successfully',
    },
  },
})

const createVuexStore = (initialState = {}) =>
  createStore({
    state: () => ({
      username: null,
      ...initialState,
    }),
    mutations: {
      username(state, newUsername) {
        state.username = newUsername
      },
    },
  })

const mutationMock = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: mutationMock,
  })),
}))

const toastErrorMock = vi.fn()
const toastSuccessMock = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: toastErrorMock,
    toastSuccess: toastSuccessMock,
  }),
}))

const valuesMock = {}
const errorsMock = {}
const setFieldValueMock = vi.fn((field, value) => {
  valuesMock[field] = value
})
const handleSubmitMock = vi.fn((callback) => {
  return () => callback(valuesMock)
})
vi.mock('vee-validate', () => ({
  useForm: () => ({
    handleSubmit: handleSubmitMock,
    setFieldValue: setFieldValueMock,
    values: valuesMock,
    errors: errorsMock,
  }),
}))

describe('UserName Form', () => {
  let wrapper

  const mountComponent = (storeState = {}) => {
    const store = createVuexStore(storeState)
    return mount(UserName, {
      global: {
        plugins: [store, i18n],
        stubs: {
          InputUsername: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    valuesMock.username = ''
    wrapper = mountComponent()
  })

  describe('when no username is set', () => {
    it('renders the component', () => {
      expect(wrapper.find('div#username_form').exists()).toBe(true)
    })

    it('displays the no-username alert', () => {
      expect(wrapper.find('[data-test="username-alert"]').text()).toBe('No username set')
    })

    it('renders the InputUsername component', () => {
      expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(true)
    })
  })

  describe('when username is set', () => {
    beforeEach(() => {
      wrapper = mountComponent({ username: 'existingUser' })
    })

    it('displays the username in a readonly input', () => {
      expect(wrapper.find('[data-test="username-input-readonly"]').exists()).toBe(true)
    })

    it('does not render the InputUsername component', () => {
      expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(false)
    })
  })

  describe('username submission', () => {
    beforeEach(() => {
      wrapper = mountComponent()
    })

    it('enables submit button when a new username is entered', async () => {
      setFieldValueMock('username', 'newUser')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-test="submit-username-button"]').exists()).toBe(true)
      expect(
        wrapper.find('[data-test="submit-username-button"]').attributes('disabled'),
      ).toBeFalsy()
    })

    it('submits the form and updates the store on success', async () => {
      mutationMock.mockResolvedValue({ data: { updateUserInfos: { validValues: 3 } } })

      setFieldValueMock('username', 'newUser')
      await wrapper.find('form').trigger('submit')

      expect(mutationMock).toHaveBeenCalledWith({ alias: 'newUser' })
      expect(wrapper.vm.store.state.username).toBe('newUser')
      expect(toastSuccessMock).toHaveBeenCalledWith('Username changed successfully')
    })

    it('shows an error toast on submission failure', async () => {
      mutationMock.mockRejectedValue(new Error('API Error'))

      setFieldValueMock('username', 'newUser')
      await wrapper.find('form').trigger('submit')

      expect(mutationMock).toHaveBeenCalledWith({ alias: 'newUser' })
      expect(toastErrorMock).toHaveBeenCalledWith('API Error')
    })
  })
})
