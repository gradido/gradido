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
  BButton: { template: '<button @click=\"$emit(`click`)\"><slot></slot></button>' },
  // Honours modelValue so that "the question was asked" is something a test can see.
  BModal: {
    props: ['modelValue'],
    template: '<div v-if=\"modelValue\"><slot></slot><slot name=\"footer\"></slot></div>',
  },
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
      'settings.username.confirm-title': 'Really change your username?',
      'settings.username.confirm-reserved': '{name} stays reserved for you.',
      'settings.username.confirm-left': 'one more change after this | {n} more changes after this',
      'settings.username.confirm-last': 'this is your last change this year',
      'settings.username.confirm-free': 'you had this name before, it is free',
      'form.cancel': 'Cancel',
      'form.change': 'Change',
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
const quotaMock = ref({
  aliasStatus: { changesLeft: 3, nextChangeAt: null, ownAliases: [], aliasSettled: true },
})
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
    quotaMock.value = {
      aliasStatus: { changesLeft: 3, nextChangeAt: null, ownAliases: [], aliasSettled: true },
    }
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

    // While the query is on its way `changesLeft` is null, and a count of null reads as
    // zero - so the page announced "0 more changes" on every single load of the settings
    // before the real answer arrived.
    it('says nothing about the quota until the answer is here', () => {
      quotaMock.value = {}
      wrapper = mountComponent()

      expect(wrapper.find('[data-test="username-quota-left"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="username-quota-blocked"]').exists()).toBe(false)
    })

    it('uses the singular form for the last one', async () => {
      quotaMock.value = {
        aliasStatus: { changesLeft: 1, nextChangeAt: null, ownAliases: [], aliasSettled: true },
      }
      wrapper = mountComponent()
      expect(wrapper.find('[data-test="username-quota-left"]').text()).toBe('one more change')
    })

    describe('when it is used up', () => {
      beforeEach(async () => {
        quotaMock.value = {
          aliasStatus: {
            changesLeft: 0,
            nextChangeAt: '2027-02-03T10:00:00.000Z',
            ownAliases: [],
            aliasSettled: true,
          },
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

      // The quota blocks TAKING a name. Coming back to one already owned writes no row
      // and the server does not even look at the quota - so disabling the button here
      // made the form stricter than the rule it enforces, and put the "this one is
      // free" line of the confirmation permanently out of reach.
      it('still offers it for a name the member already owns', async () => {
        quotaMock.value = {
          aliasStatus: {
            changesLeft: 0,
            nextChangeAt: '2027-02-03T10:00:00.000Z',
            ownAliases: ['newUser'],
            aliasSettled: true,
          },
        }
        wrapper = mountComponent({ username: 'existingUser' })
        valuesMock.value.username = 'newUser'
        await wrapper.vm.$nextTick()

        expect(
          wrapper.find('[data-test="submit-username-button"]').attributes('disabled'),
        ).toBeUndefined()
      })
    })
  })

  // A dialog naming only the new name gets clicked away; the old one beside it is what
  // makes somebody read before saving. Nothing is written until it is answered.
  describe('the confirmation before saving', () => {
    beforeEach(async () => {
      wrapper = mountComponent({ username: 'oldName' })
      valuesMock.value.username = 'newName'
      await wrapper.vm.$nextTick()
    })

    it('asks nothing until the form is submitted', () => {
      expect(wrapper.find('[data-test="confirm-username-modal"]').exists()).toBe(false)
    })

    it('shows both names once it is asked', async () => {
      await wrapper.find('form').trigger('submit')

      expect(wrapper.find('[data-test="confirm-old"]').text()).toBe('oldName')
      expect(wrapper.find('[data-test="confirm-new"]').text()).toBe('newName')
    })

    it('says what the change leaves, and that the old name is kept', async () => {
      await wrapper.find('form').trigger('submit')

      expect(wrapper.find('[data-test="confirm-left"]').text()).toBe('2 more changes after this')
      expect(wrapper.text()).toContain('oldName stays reserved for you.')
    })

    it('warns when it is the last change of the year', async () => {
      quotaMock.value = {
        aliasStatus: { changesLeft: 1, nextChangeAt: null, ownAliases: [], aliasSettled: true },
      }
      wrapper = mountComponent({ username: 'oldName' })
      await wrapper.find('form').trigger('submit')

      expect(wrapper.find('[data-test="confirm-last"]').exists()).toBe(true)
    })

    // Coming back to a name one already owns takes no name into possession, so it is
    // free - and saying so is the difference between a rule and a surprise.
    it('says a name of one´s own costs nothing', async () => {
      quotaMock.value = {
        aliasStatus: {
          changesLeft: 2,
          nextChangeAt: null,
          ownAliases: ['newName'],
          aliasSettled: true,
        },
      }
      wrapper = mountComponent({ username: 'oldName' })
      await wrapper.find('form').trigger('submit')

      expect(wrapper.find('[data-test="confirm-free"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="confirm-left"]').exists()).toBe(false)
    })

    // The column ignores case, so `newname` and `newName` are the very same row and the
    // return is just as free. A case-sensitive comparison here told the member their
    // free return would cost one of the four.
    it('says so whatever the capitalisation', async () => {
      quotaMock.value = {
        aliasStatus: {
          changesLeft: 2,
          nextChangeAt: null,
          ownAliases: ['newname'],
          aliasSettled: true,
        },
      }
      wrapper = mountComponent({ username: 'oldName' })
      valuesMock.value.username = 'newName'
      await wrapper.vm.$nextTick()
      await wrapper.find('form').trigger('submit')

      expect(wrapper.find('[data-test="confirm-free"]').exists()).toBe(true)
    })

    it('writes nothing while the question stands', async () => {
      await wrapper.find('form').trigger('submit')

      expect(mutationMock).not.toHaveBeenCalled()
    })

    it('writes nothing when the member says no', async () => {
      await wrapper.find('form').trigger('submit')
      await wrapper.find('[data-test="confirm-cancel"]').trigger('click')

      expect(mutationMock).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="confirm-username-modal"]').exists()).toBe(false)
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
      await wrapper.find('[data-test="confirm-change"]').trigger('click')

      expect(mutationMock).toHaveBeenCalledWith({ alias: 'newUser' })
      expect(wrapper.vm.store.state.username).toBe('newUser')
      expect(toastSuccessMock).toHaveBeenCalledWith('Username changed successfully')
    })

    it('shows an error toast on submission failure', async () => {
      mutationMock.mockRejectedValue(new Error('API Error'))

      valuesMock.value.username = 'newUser'
      await wrapper.vm.$nextTick()
      await wrapper.find('form').trigger('submit')
      await wrapper.find('[data-test="confirm-change"]').trigger('click')

      expect(mutationMock).toHaveBeenCalledWith({ alias: 'newUser' })
      expect(toastErrorMock).toHaveBeenCalledWith('API Error')
    })
  })
})
