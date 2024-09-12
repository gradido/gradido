import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContributionForm from './ContributionForm.vue'
import { useForm } from 'vee-validate'

// Mock external components and dependencies
vi.mock('@/components/Inputs/InputHour', () => ({
  default: {
    name: 'InputHour',
    template: '<input data-testid="input-hour" />',
  },
}))

vi.mock('@/components/Inputs/InputAmount', () => ({
  default: {
    name: 'InputAmount',
    template: '<input data-testid="input-amount" />',
  },
}))

vi.mock('@/components/Inputs/InputTextarea', () => ({
  default: {
    name: 'InputTextarea',
    template: '<textarea data-testid="input-textarea"></textarea>',
  },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('vee-validate', () => ({
  useForm: vi.fn(() => ({
    values: {},
    meta: { value: { valid: true } },
    resetForm: vi.fn(),
    defineField: vi.fn(() => []),
    setFieldValue: vi.fn(),
  })),
  useField: vi.fn(() => ({
    meta: { value: { valid: true } },
  })),
}))

describe('ContributionForm', () => {
  let wrapper

  const defaultProps = {
    modelValue: {
      date: '2024-09-12',
      memo: 'Test memo',
      hours: 2,
      amount: 40,
    },
    isThisMonth: true,
    minimalDate: new Date('2024-01-01'),
    maxGddLastMonth: 100,
    maxGddThisMonth: 200,
  }

  beforeEach(() => {
    wrapper = mount(ContributionForm, {
      props: defaultProps,
      global: {
        stubs: ['BForm', 'BFormInput', 'BRow', 'BCol', 'BButton'],
      },
    })
  })

  it('renders the form correctly', () => {
    expect(wrapper.find('.contribution-form').exists()).toBe(true)
  })

  it('computes showMessage correctly', async () => {
    expect(wrapper.vm.showMessage).toBe(false)

    await wrapper.setProps({
      maxGddThisMonth: 0,
      maxGddLastMonth: 0,
    })

    expect(wrapper.vm.showMessage).toBe(true)
  })

  it('computes disabled correctly', async () => {
    expect(wrapper.vm.disabled).toBe(false)

    await wrapper.setProps({
      maxGddThisMonth: 30,
    })

    wrapper.vm.form.amount = 100

    expect(wrapper.vm.disabled).toBe(true)
  })

  it('computes validMaxGDD correctly', async () => {
    expect(wrapper.vm.validMaxGDD).toBe(200)

    await wrapper.setProps({ isThisMonth: false })

    expect(wrapper.vm.validMaxGDD).toBe(100)
  })

  it('updates amount when hours change', async () => {
    const setFieldValueMock = vi.fn()
    vi.mocked(useForm).mockReturnValue({
      ...vi.mocked(useForm)(),
      setFieldValue: setFieldValueMock,
    })

    wrapper = mount(ContributionForm, {
      props: defaultProps,
      global: {
        stubs: ['BForm', 'BFormInput', 'BRow', 'BCol', 'BButton'],
      },
    })

    await wrapper.vm.$nextTick()

    // Simulate changing hours
    wrapper.vm.updateAmount(3)

    expect(setFieldValueMock).toHaveBeenCalledWith('amount', '60.00')
  })

  it('emits update-contribution event on submit for existing contribution', async () => {
    const existingContribution = {
      ...defaultProps.modelValue,
      id: '123',
    }

    wrapper = mount(ContributionForm, {
      props: {
        ...defaultProps,
        modelValue: existingContribution,
      },
      global: {
        stubs: ['BForm', 'BFormInput', 'BRow', 'BCol', 'BButton'],
      },
    })

    await wrapper.vm.$nextTick()

    wrapper.vm.submit()

    expect(wrapper.emitted('update-contribution')).toBeTruthy()
    expect(wrapper.emitted('update-contribution')[0][0]).toEqual(
      expect.objectContaining({
        id: '123',
      }),
    )
  })

  it('emits set-contribution event on submit for new contribution', async () => {
    wrapper.vm.submit()

    expect(wrapper.emitted('set-contribution')).toBeTruthy()
  })

  it('resets form on fullFormReset', () => {
    const resetFormMock = vi.fn()
    vi.mocked(useForm).mockReturnValue({
      ...vi.mocked(useForm)(),
      resetForm: resetFormMock,
    })

    wrapper = mount(ContributionForm, {
      props: defaultProps,
      global: {
        stubs: ['BForm', 'BFormInput', 'BRow', 'BCol', 'BButton'],
      },
    })

    wrapper.vm.fullFormReset()

    expect(resetFormMock).toHaveBeenCalledWith({
      values: {
        id: null,
        date: '',
        memo: '',
        hours: 0,
        amount: '',
      },
    })
  })
})
