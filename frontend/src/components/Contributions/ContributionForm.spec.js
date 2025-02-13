import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContributionForm from './ContributionForm.vue'
import { useForm } from 'vee-validate'

// Mock external components and dependencies
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

  describe('compute isThisMonth', () => {
    it('return true', async () => {
      await wrapper.setProps({
        modelValue: { date: new Date().toISOString() }
      })
      expect(wrapper.vm.isThisMonth).toBe(true)  
    })
    it('return false', async () => {
      const now = new Date()
      const lastMonth = new Date(now.setMonth(now.getMonth() - 1, 1))
      await wrapper.setProps({
        modelValue: { date: lastMonth.toISOString() }
      })
      expect(wrapper.vm.isThisMonth).toBe(false)  
    })
  })

  describe('noOpenCreations return correct translation key', () => {
    it("if both max gdd are > 0", () => {
      expect(wrapper.vm.noOpenCreation).toBeUndefined()
    })
    it('if max gdd for this month is 0, and form.date is in last month', async () => {
      const now = new Date()
      const lastMonth = new Date(now.setMonth(now.getMonth() - 1, 1))
      await wrapper.setProps({
        maxGddThisMonth: 0,
        modelValue: { date: lastMonth.toISOString() }
      })
      expect(wrapper.vm.noOpenCreation).toBeUndefined()
    })
    it('if max gdd for last month is 0, and form.date is in this month', async () => {
      await wrapper.setProps({
        maxGddLastMonth: 0,
        modelValue: { date: new Date().toISOString() }
      })
      expect(wrapper.vm.noOpenCreation).toBeUndefined()
    })
    it('if max gdd is 0 for both months', async () => {
      await wrapper.setProps({
        maxGddThisMonth: 0,
        maxGddLastMonth: 0,
      })
      expect(wrapper.vm.noOpenCreation).toBe('contribution.noOpenCreation.allMonth')  
    })
    it('if max gdd this month is zero and form.date is inside this month', async () => {
      await wrapper.setProps({
        maxGddThisMonth: 0,
        modelValue: { date: new Date().toISOString() }
      })
      expect(wrapper.vm.noOpenCreation).toBe('contribution.noOpenCreation.thisMonth')  
    })
    it('if max gdd last month is zero and form.date is inside last month', async () => {
      const now = new Date()
      const lastMonth = new Date(now.setMonth(now.getMonth() - 1, 1))
      await wrapper.setProps({
        maxGddLastMonth: 0,
        modelValue: { date: lastMonth.toISOString() }
      })
      expect(wrapper.vm.noOpenCreation).toBe('contribution.noOpenCreation.lastMonth')  
    })
  })

  it('computes disabled correctly', async () => {
    expect(wrapper.vm.disabled).toBe(true)

    await wrapper.setProps({
      modelValue: { date: new Date().toISOString().slice(0, 10) }
    })

    wrapper.vm.form.amount = 100
    
    expect(wrapper.vm.disabled).toBe(false)
  })  

  it('updates amount when hours change', async () => {
    
    wrapper = mount(ContributionForm, {
      props: defaultProps,
      global: {
        stubs: ['BForm', 'BFormInput', 'BRow', 'BCol', 'BButton'],
      },
    })

    await wrapper.vm.$nextTick()

    // Simulate changing hours
    wrapper.vm.updateField(3, 'hours')

    expect(wrapper.vm.form.amount).toBe('60.00')
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
})
