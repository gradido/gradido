import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { suggestedGroupTag } from '@/graphql/contributions.graphql'
import ContributionForm from './ContributionForm.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (date) => date,
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

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({ result: { value: undefined } })),
}))

const global = {
  stubs: ['BForm', 'BFormInput', 'BFormGroup', 'BFormSelect', 'BRow', 'BCol', 'BButton'],
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

  // The group field is pre-filled with what the member last said themselves — derived in
  // the backend from their own history, so there is no stored "main group" to go stale.
  describe('group pre-fill', () => {
    const withSuggestion = (tag) => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === suggestedGroupTag) {
          return { result: ref(tag ? { suggestedGroupTag: { id: 1, tag, name: null } } : {}) }
        }
        return { result: ref(undefined) }
      })
    }

    const mountWith = (modelValue = {}) =>
      mount(ContributionForm, {
        props: { ...defaultProps, modelValue: { ...defaultProps.modelValue, ...modelValue } },
        global,
      })

    it('pre-fills the suggested group', () => {
      withSuggestion('feuerwehr')
      expect(mountWith().vm.selectedGroupTag).toBe('feuerwehr')
    })

    it('asks the server for the suggestion instead of trusting the cache', () => {
      // Submitting swaps this form out for the success screen, so coming back mounts a
      // fresh one. With the default cache-first policy that fresh form is handed the
      // answer from BEFORE the submission — which is what put the old group back after
      // someone had just switched to "no group". Only the policy can be asserted here;
      // a component test has no Apollo cache to go stale.
      withSuggestion('feuerwehr')
      mountWith()
      expect(useQuery).toHaveBeenCalledWith(
        suggestedGroupTag,
        expect.anything(),
        expect.objectContaining({ fetchPolicy: 'no-cache' }),
      )
    })

    it('leaves the field empty when there is nothing to suggest', () => {
      // Also the deliberate "no group" case: the backend answers with nothing, and the
      // field must not fall back to some earlier group.
      withSuggestion(null)
      expect(mountWith().vm.selectedGroupTag).toBe('')
    })

    it('does not overwrite a group that is already chosen', () => {
      withSuggestion('feuerwehr')
      expect(mountWith({ groupTags: ['chor'] }).vm.selectedGroupTag).toBe('chor')
    })

    it('does not pre-fill when an existing contribution is edited', () => {
      // Editing must not silently move a contribution into another group.
      withSuggestion('feuerwehr')
      expect(mountWith({ id: '123' }).vm.selectedGroupTag).toBe('')
    })
  })
})
