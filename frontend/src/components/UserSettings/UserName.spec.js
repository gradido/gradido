import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
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
      'settings.username.change-success': 'Username changed successfully',
      'settings.username.confirm-change': '{from} becomes {to}. Are you sure?',
      'settings.username.quota-left': 'one more change | {n} more changes',
      'settings.username.quota-blocked': 'used up, again from {date}',
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
const refetchQuotaMock = vi.fn()
// The settings page asks for the quota before anything is typed, so the component
// mounts a query as well as a mutation.
const quotaMock = ref({ aliasQuota: { changesLeft: 3, nextChangeAt: null } })
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: mutationMock,
  })),
  useQuery: vi.fn(() => ({
    result: quotaMock,
    refetch: refetchQuotaMock,
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

// Updated to use Vue's reactivity
const valuesMock = ref({ username: '' })
const errorsMock = ref({})
const setFieldValueMock = vi.fn((field, value) => {
  valuesMock.value[field] = value
})
const handleSubmitMock = vi.fn((callback) => {
  return () => callback(valuesMock.value)
})

vi.mock('vee-validate', () => ({
  useForm: () => ({
    handleSubmit: handleSubmitMock,
    setFieldValue: setFieldValueMock,
    values: valuesMock.value,
    errors: errorsMock.value,
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
    valuesMock.value.username = ''
    quotaMock.value = { aliasQuota: { changesLeft: 3, nextChangeAt: null } }
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    wrapper = mountComponent()
  })

  describe('when no username is set', () => {
    it('renders the component', () => {
      expect(wrapper.find('div#username-form').exists()).toBe(true)
    })

    it('renders the InputUsername component', () => {
      expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(true)
    })
  })

  // The alias can be changed now, so there is only one field left and it is always the
  // editable one - prefilled with what is stored. The readonly display and the
  // "you have no username yet" alert both belonged to the set-once behaviour.
  describe('when username is set', () => {
    beforeEach(() => {
      wrapper = mountComponent({ username: 'existingUser' })
    })

    it('still renders the InputUsername component', () => {
      expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(true)
    })

    it('hands the stored username to the input as its initial value', () => {
      expect(
        wrapper.findComponent({ name: 'InputUsername' }).attributes('initial-username-value'),
      ).toBe('existingUser')
    })
  })

  // Four picks a year is the brake against hoarding near-misses of a popular name, so
  // the page has to say where the member stands before they type - and name a date
  // rather than refuse them afterwards.
  describe('the yearly quota', () => {
    it('says how many changes are left', () => {
      expect(wrapper.find('[data-test="username-quota-left"]').text()).toBe('3 more changes')
    })

    it('uses the singular form for the last one', async () => {
      quotaMock.value = { aliasQuota: { changesLeft: 1, nextChangeAt: null } }
      wrapper = mountComponent()
      expect(wrapper.find('[data-test="username-quota-left"]').text()).toBe('one more change')
    })

    describe('when it is used up', () => {
      beforeEach(async () => {
        quotaMock.value = {
          aliasQuota: { changesLeft: 0, nextChangeAt: '2027-02-03T10:00:00.000Z' },
        }
        wrapper = mountComponent({ username: 'existingUser' })
        valuesMock.value.username = 'newUser'
        await wrapper.vm.$nextTick()
      })

      it('names the date it becomes possible again', () => {
        expect(wrapper.find('[data-test="username-quota-blocked"]').text()).toContain('again from')
      })

      it('does not offer the save button', () => {
        expect(
          wrapper.find('[data-test="submit-username-button"]').attributes('disabled'),
        ).toBeDefined()
      })
    })
  })

  // A dialog naming only the new name gets clicked away; the old one next to it is
  // what makes somebody read before saving.
  describe('the confirmation before saving', () => {
    beforeEach(() => {
      wrapper = mountComponent({ username: 'oldName' })
      valuesMock.value.username = 'newName'
    })

    it('asks with both names', async () => {
      await wrapper.find('form').trigger('submit')
      expect(window.confirm).toHaveBeenCalledWith('oldName becomes newName. Are you sure?')
    })

    it('saves nothing when the member says no', async () => {
      window.confirm.mockReturnValue(false)
      await wrapper.find('form').trigger('submit')
      expect(mutationMock).not.toHaveBeenCalled()
    })
  })

  describe('username submission', () => {
    beforeEach(() => {
      wrapper = mountComponent()
    })

    it('enables submit button when a new username is entered', async () => {
      valuesMock.value.username = 'newUser' // Directly set the reactive value
      await wrapper.vm.$nextTick()

      // Trigger input change to ensure reactivity
      await wrapper.find('[data-test="component-input-username"]').trigger('input')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-test="submit-username-button"]').exists()).toBe(true)
      expect(
        wrapper.find('[data-test="submit-username-button"]').attributes('disabled'),
      ).toBeFalsy()
    })

    it('submits the form and updates the store on success', async () => {
      mutationMock.mockResolvedValue({ data: { updateUserInfos: { validValues: 3 } } })

      valuesMock.value.username = 'newUser'
      await wrapper.vm.$nextTick()
      await wrapper.find('form').trigger('submit')

      expect(mutationMock).toHaveBeenCalledWith({ alias: 'newUser' })
      expect(wrapper.vm.store.state.username).toBe('newUser')
      expect(toastSuccessMock).toHaveBeenCalledWith('Username changed successfully')
    })

    it('shows an error toast on submission failure', async () => {
      mutationMock.mockRejectedValue(new Error('API Error'))

      valuesMock.value.username = 'newUser'
      await wrapper.vm.$nextTick()
      await wrapper.find('form').trigger('submit')

      expect(mutationMock).toHaveBeenCalledWith({ alias: 'newUser' })
      expect(toastErrorMock).toHaveBeenCalledWith('API Error')
    })
  })
})
