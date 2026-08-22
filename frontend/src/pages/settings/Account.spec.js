// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import flushPromises from 'flush-promises'
import { createStore } from 'vuex'
import { BButton, BCol, BForm, BFormInput, BRow } from 'bootstrap-vue-next'
import Account from './Account.vue'

const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({ useMutation: () => ({ mutate: mockMutate }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

const mountAccount = () =>
  mount(Account, {
    global: {
      plugins: [
        createStore({
          state: () => ({ firstName: 'John', lastName: 'Doe' }),
          mutations: {
            firstName: (state, value) => (state.firstName = value),
            lastName: (state, value) => (state.lastName = value),
          },
        }),
      ],
      stubs: {
        BRow,
        BCol,
        BForm,
        BFormInput,
        BButton,
        RouterLink: true,
        'user-name': true,
        'user-email': true,
        'user-password': true,
      },
      mocks: { $t: (key) => key },
    },
  })

describe('the account section', () => {
  /**
   * The save button carries `type="submit"` and prevents the default on its own click, but a
   * form with a submit button submits on Enter as well -- and with no handler on the form
   * that is a native submit: the page reloads and the typing is gone. It was that way on the
   * old settings page too.
   */
  it('saves when Enter is pressed in a name field, rather than reloading the page', async () => {
    const wrapper = mountAccount()
    await wrapper.find('[data-test="firstname"]').setValue('Janer')
    mockMutate.mockClear()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockMutate).toHaveBeenCalledWith({ firstName: 'Janer', lastName: 'Doe' })
  })

  it('offers the save button only once something differs', async () => {
    const wrapper = mountAccount()
    expect(wrapper.find('[data-test="submit-userdata"]').exists()).toBe(false)

    await wrapper.find('[data-test="lastname"]').setValue('Does')

    expect(wrapper.find('[data-test="submit-userdata"]').exists()).toBe(true)
  })
})
