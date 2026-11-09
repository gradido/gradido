// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { ContributionEdit } from './ContributionEdit'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

const { mockMutate, mockReset } = vi.hoisted(() => ({ mockMutate: vi.fn(), mockReset: vi.fn() }))
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: mockMutate }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

// The form itself has its own spec; here only what it is handed matters.
vi.mock('@/components/Contributions/ContributionForm', () => ({
  ContributionForm: {
    name: 'ContributionForm',
    props: ['modelValue', 'maxGddLastMonth', 'maxGddThisMonth'],
    template: '<form />',
    methods: { reset: mockReset },
  },
}))

const CONTRIBUTION = { id: 7, contributionDate: '2026-11-03', memo: 'Gartenarbeit', amount: '40' }

const mountWith = (openCreations) => {
  const result = ref(openCreations)
  vi.mocked(useQuery).mockReturnValue({ result })
  return { wrapper: mount(ContributionEdit, { props: { modelValue: CONTRIBUTION } }), result }
}

describe('ContributionEdit', () => {
  // With both limits at 0 the form says "nothing open to create" until the answer lands.
  it('shows no form before the open creations are known', () => {
    const { wrapper } = mountWith(undefined)
    expect(wrapper.findComponent({ name: 'ContributionForm' }).exists()).toBe(false)
  })

  it('opens the form with the limits once they are known', async () => {
    const { wrapper, result } = mountWith(undefined)
    result.value = {
      openCreations: [
        { year: 2026, month: 8, amount: '1000' },
        { year: 2026, month: 9, amount: '700' },
        { year: 2026, month: 10, amount: '900' },
      ],
    }
    await nextTick()
    const form = wrapper.findComponent({ name: 'ContributionForm' })
    expect(form.exists()).toBe(true)
    expect(form.props('modelValue')).toEqual(CONTRIBUTION)
    expect(form.props('maxGddLastMonth')).toBe(700)
    // The contribution's own amount counts as still open in the month it is dated in.
    expect(form.props('maxGddThisMonth')).toBe(940)
  })

  // The form locks its button on submit; a refused change has to unlock it for a second try.
  it('frees the form again when the change is refused', async () => {
    mockMutate.mockRejectedValueOnce(new Error('refused'))
    const { wrapper } = mountWith({ openCreations: [{}, { amount: '1' }, { amount: '1' }] })

    wrapper
      .findComponent({ name: 'ContributionForm' })
      .vm.$emit('upsert-contribution', CONTRIBUTION)
    await flushPromises()

    expect(mockReset).toHaveBeenCalledTimes(1)
  })
})
