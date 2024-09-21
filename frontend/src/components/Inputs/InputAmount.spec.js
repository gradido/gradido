import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import InputAmount from './InputAmount'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { BFormInput } from 'bootstrap-vue-next'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: {},
    path: '/some-path',
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key) => key,
    n: (num) => num,
  })),
}))

vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    value: ref(''),
    meta: { valid: true },
    errorMessage: ref(''),
  })),
}))

// Mock toast
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

describe('InputAmount', () => {
  let wrapper

  const createWrapper = (propsData = {}) => {
    return mount(InputAmount, {
      props: {
        name: 'amount',
        label: 'Amount',
        placeholder: 'Enter amount',
        typ: 'TransactionForm',
        modelValue: '12,34',
        ...propsData,
      },
      global: {
        mocks: {
          $route: useRoute(),
          ...useI18n(),
        },
        components: {
          BFormInput,
        },
        directives: {
          focus: {},
        },
        stubs: {
          BFormGroup: true,
          BFormInvalidFeedback: true,
          BInputGroup: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mount in a TransactionForm', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component input-amount', () => {
      expect(wrapper.find('div.input-amount').exists()).toBe(true)
    })

    it('normalizes the amount correctly', async () => {
      await wrapper.vm.normalizeAmount('12,34')
      expect(wrapper.vm.value).toBe('12.34')
    })

    it('does not normalize invalid input', async () => {
      await wrapper.vm.normalizeAmount('12m34')
      expect(wrapper.vm.value).toBe('12m34')
    })
  })

  describe('mount in a ContributionForm', () => {
    beforeEach(() => {
      wrapper = createWrapper({
        typ: 'ContributionForm',
        modelValue: '12.34',
      })
    })

    it('renders the component input-amount', () => {
      expect(wrapper.find('div.input-amount').exists()).toBe(true)
    })

    it('normalizes the amount correctly', async () => {
      await wrapper.vm.normalizeAmount('12.34')
      expect(wrapper.vm.value).toBe('12.34')
    })

    it('does not normalize invalid input', async () => {
      await wrapper.vm.normalizeAmount('12m34')
      expect(wrapper.vm.value).toBe('12m34')
    })
  })

  it('emits update:modelValue when value changes', async () => {
    wrapper = createWrapper()
    await wrapper.vm.normalizeAmount('15.67')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['15.67'])
  })
})
