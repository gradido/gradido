// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { createStore } from 'vuex'
import UserCreationAccount from './UserCreationAccount.vue'

// The radio group is a stub that a test can drive the way the member does: by choosing.
vi.mock('bootstrap-vue-next', () => ({
  BFormRadioGroup: {
    props: ['modelValue', 'options', 'disabled'],
    emits: ['update:modelValue'],
    template: `<div>
      <label v-for="option in options" :key="option.value">
        <input type="radio" :value="option.value" :checked="option.value === modelValue"
          :disabled="disabled" :data-test="'choice-' + option.value"
          @change="$emit('update:modelValue', option.value)" />
        {{ option.text }}
      </label>
    </div>`,
  },
}))

const declareMock = vi.fn()
const requestMock = vi.fn()
vi.mock('@/graphql/user.graphql', () => ({
  declareProjectAccount: 'DECLARE_PROJECT_ACCOUNT',
  requestCreationRight: 'REQUEST_CREATION_RIGHT',
}))
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => ({
    mutate: () => (document === 'DECLARE_PROJECT_ACCOUNT' ? declareMock() : requestMock()),
  }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastSuccess, toastError }) }))

const build = (creationAllowed) => {
  const store = createStore({
    state: () => ({ creationAllowed }),
    mutations: { creationAllowed: (state, value) => (state.creationAllowed = value) },
  })
  const wrapper = mount(UserCreationAccount, {
    global: { plugins: [store], mocks: { $t: (key) => key } },
  })
  return { wrapper, store }
}

const checkedChoice = (wrapper) =>
  wrapper
    .findAll('input[type="radio"]')
    .find((input) => input.element.checked)
    ?.attributes('data-test')

const settle = async () => {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

beforeEach(() => {
  declareMock.mockReset().mockResolvedValue({ data: { declareProjectAccount: true } })
  requestMock.mockReset().mockResolvedValue({ data: { requestCreationRight: true } })
  toastSuccess.mockClear()
  toastError.mockClear()
})

describe('UserCreationAccount', () => {
  it('shows a person for an account that may create, and for one the store does not know yet', () => {
    expect(checkedChoice(build(true).wrapper)).toBe('choice-person')
    expect(checkedChoice(build(null).wrapper)).toBe('choice-person')
  })

  it('shows the project account where creation is off', () => {
    expect(checkedChoice(build(false).wrapper)).toBe('choice-project')
  })

  describe('switching off - the holder decides, at once', () => {
    it('declares the project account and writes the store', async () => {
      const { wrapper, store } = build(true)
      await wrapper.find('[data-test="choice-project"]').trigger('change')
      await settle()
      expect(declareMock).toHaveBeenCalledTimes(1)
      expect(requestMock).not.toHaveBeenCalled()
      expect(store.state.creationAllowed).toBe(false)
      expect(checkedChoice(wrapper)).toBe('choice-project')
      expect(toastSuccess).toHaveBeenCalledWith('settings.creationAccount.declared')
    })

    it('stays a person and says why when contributions are still open', async () => {
      declareMock.mockRejectedValue(new Error('PROJECT_ACCOUNT_REFUSED: OPEN_CONTRIBUTIONS'))
      const { wrapper, store } = build(true)
      await wrapper.find('[data-test="choice-project"]').trigger('change')
      await settle()
      expect(store.state.creationAllowed).toBe(true)
      expect(checkedChoice(wrapper)).toBe('choice-person')
      expect(toastError).toHaveBeenCalledWith('settings.creationAccount.openContributions')
    })
  })

  describe('switching back on - a request, a person checks it', () => {
    it('asks the support, shows the hint and leaves the radio where the row is', async () => {
      const { wrapper, store } = build(false)
      await wrapper.find('[data-test="choice-person"]').trigger('change')
      await settle()
      expect(requestMock).toHaveBeenCalledTimes(1)
      expect(declareMock).not.toHaveBeenCalled()
      // Nothing changed on the account: the switch is the administrator's.
      expect(store.state.creationAllowed).toBe(false)
      expect(checkedChoice(wrapper)).toBe('choice-project')
      expect(wrapper.find('[data-test="creation-account-hint"]').text()).toBe(
        'settings.creationAccount.requested',
      )
    })

    it('tells the member a mail already went out today', async () => {
      requestMock.mockRejectedValue(new Error('CREATION_RIGHT_REQUEST_REFUSED: RATE_LIMITED'))
      const { wrapper } = build(false)
      await wrapper.find('[data-test="choice-person"]').trigger('change')
      await settle()
      expect(wrapper.find('[data-test="creation-account-hint"]').text()).toBe(
        'settings.creationAccount.rateLimited',
      )
      expect(toastError).not.toHaveBeenCalled()
      expect(checkedChoice(wrapper)).toBe('choice-project')
    })
  })
})
