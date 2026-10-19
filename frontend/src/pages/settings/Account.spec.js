// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import flushPromises from 'flush-promises'
import { walletStore } from '@test/walletStore'
import { BButton, BCol, BForm, BFormInput, BRow } from 'bootstrap-vue-next'
import Account from './Account.vue'

const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({ useMutation: () => ({ mutate: mockMutate }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
// The wallet store sets the language on the app's own i18n, which this spec does not build.
vi.mock('@/i18n', () => ({ default: { global: { locale: { value: 'en' } } } }))
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

const mountAccount = () =>
  mount(Account, {
    global: {
      plugins: [walletStore({ firstName: 'John', lastName: 'Doe' })],
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
        'user-creation-account': true,
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

  /**
   * The card below opens with "change password" and a pencil. A label of ours saying just
   * "password" beside it repeated the word without being the thing one clicks -- two halves
   * of one line, neither of them the button. (Bernd, 27.08.2026)
   */
  it('leaves the password heading to the card that carries the button', () => {
    const wrapper = mountAccount()

    expect(wrapper.findComponent({ name: 'UserPassword' }).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('form.password')
  })

  it('offers the save button only once something differs', async () => {
    const wrapper = mountAccount()
    expect(wrapper.find('[data-test="submit-userdata"]').exists()).toBe(false)

    await wrapper.find('[data-test="lastname"]').setValue('Does')

    expect(wrapper.find('[data-test="submit-userdata"]').exists()).toBe(true)
  })
})
