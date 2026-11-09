// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { ContributionCreate } from './ContributionCreate'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key, d: (date) => String(date) }),
}))

const { mockMutate, mockReset, mockRefetch } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockReset: vi.fn(),
  mockRefetch: vi.fn(),
}))
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: mockMutate }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

// The form has its own spec; here only what it is told matters.
vi.mock('@/components/Contributions/ContributionForm', () => ({
  ContributionForm: {
    name: 'ContributionForm',
    props: ['modelValue', 'maxGddLastMonth', 'maxGddThisMonth'],
    template: '<form />',
    methods: { reset: mockReset },
  },
}))

const CONTRIBUTION = {
  contributionDate: '2026-11-03',
  memo: 'Gartenarbeit',
  hours: '2',
  amount: '40',
}

describe('ContributionCreate', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQuery).mockReturnValue({
      result: ref({ openCreations: [{ amount: '0' }, { amount: '700' }, { amount: '900' }] }),
      refetch: mockRefetch,
    })
    // The success screen (SuccessMessage.vue) still reads $t from the template.
    wrapper = mount(ContributionCreate, { global: { mocks: { $t: (key) => key } } })
  })

  const submit = () =>
    wrapper
      .findComponent({ name: 'ContributionForm' })
      .vm.$emit('upsert-contribution', CONTRIBUTION)

  it('hands the form the open amounts of both months', () => {
    const form = wrapper.findComponent({ name: 'ContributionForm' })
    expect(form.props('maxGddLastMonth')).toBe(700)
    expect(form.props('maxGddThisMonth')).toBe(900)
  })

  it('swaps the form for the success screen once the contribution is accepted', async () => {
    mockMutate.mockResolvedValueOnce({})
    submit()
    await flushPromises()

    expect(mockMutate).toHaveBeenCalledWith(CONTRIBUTION)
    expect(mockRefetch).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-test="success-message"]').exists()).toBe(true)
    expect(mockReset).not.toHaveBeenCalled()
  })

  // The form locks its button on submit; a refused contribution has to unlock it for a second try.
  it('keeps the form and frees it again when the contribution is refused', async () => {
    mockMutate.mockRejectedValueOnce(new Error('refused'))
    submit()
    await flushPromises()

    expect(wrapper.findComponent({ name: 'ContributionForm' }).exists()).toBe(true)
    expect(mockReset).toHaveBeenCalledTimes(1)
  })
})
