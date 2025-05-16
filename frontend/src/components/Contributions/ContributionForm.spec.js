import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContributionForm from './ContributionForm.vue'

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

const global = {
  stubs: ['BForm', 'BFormInput', 'BRow', 'BCol', 'BButton'],
}

describe('ContributionForm', () => {
  let wrapper

  const defaultProps = {
    modelValue: {
      contributionDate: '2024-09-12',
      memo: 'Test memo',
      hours: 2,
      amount: 40,
    },
    maxGddLastMonth: 100,
    maxGddThisMonth: 200,
  }

  const createWrapperWithDate = (date) => {
    return mount(ContributionForm, {
      props: {
        ...defaultProps,
        modelValue: {
          ...defaultProps.modelValue,
          contributionDate: date.toISOString(),
        },
      },
      global,
    })
  }
  const thisMonth = new Date()
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1, 1)

  beforeEach(() => {
    wrapper = mount(ContributionForm, {
      props: defaultProps,
      global,
    })
  })

  it('renders the form correctly', () => {
    expect(wrapper.find('.contribution-form').exists()).toBe(true)
  })

  describe('compute isThisMonth', () => {
    it.each([
      [thisMonth, true, 'should return true for current month'],
      [lastMonth, false, 'should return false for last month'],
      [
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        false,
        'should return false for next year',
      ],
    ])('%s => %s (%s)', (date, expected, desc) => {
      const wrapper = createWrapperWithDate(date)
      expect(wrapper.vm.isThisMonth).toBe(expected)
    })
  })

  describe('noOpenCreations return correct translation key', () => {
    it('if both max gdd are > 0', () => {
      expect(wrapper.vm.noOpenCreation).toBeUndefined()
    })
    describe('if form.date is in last month', () => {
      beforeEach(() => {
        wrapper = createWrapperWithDate(lastMonth)
      })
      it('if max gdd for this month is 0', async () => {
        await wrapper.setProps({
          maxGddThisMonth: 0,
        })
        expect(wrapper.vm.noOpenCreation).toBeUndefined()
      })
      it('if max gdd last month is 0', async () => {
        await wrapper.setProps({
          maxGddLastMonth: 0,
        })
        expect(wrapper.vm.noOpenCreation).toBe('contribution.noOpenCreation.lastMonth')
      })
    })
    describe('if form.date is in this month', () => {
      beforeEach(() => {
        wrapper = createWrapperWithDate(thisMonth)
      })
      it('if max gdd for last month is 0', async () => {
        await wrapper.setProps({
          maxGddLastMonth: 0,
        })
        expect(wrapper.vm.noOpenCreation).toBeUndefined()
      })
      it('if max gdd this month is 0', async () => {
        await wrapper.setProps({
          maxGddThisMonth: 0,
        })
        expect(wrapper.vm.noOpenCreation).toBe('contribution.noOpenCreation.thisMonth')
      })
    })
    it('if max gdd is 0 for both months', async () => {
      await wrapper.setProps({
        maxGddThisMonth: 0,
        maxGddLastMonth: 0,
      })
      expect(wrapper.vm.noOpenCreation).toBe('contribution.noOpenCreation.allMonth')
    })
  })

  it('computes disabled correctly', async () => {
    expect(wrapper.vm.disabled).toBe(true)

    wrapper = createWrapperWithDate(thisMonth)

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

  it('emits upsert-contribution event on submit for existing contribution', async () => {
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

    expect(wrapper.emitted('upsert-contribution')).toBeTruthy()
    expect(wrapper.emitted('upsert-contribution')[0][0]).toEqual(
      expect.objectContaining({
        id: '123',
      }),
    )
  })

  it('emits upsert-contribution event on submit for new contribution', async () => {
    wrapper.vm.submit()

    expect(wrapper.emitted('upsert-contribution')).toBeTruthy()
  })
})
