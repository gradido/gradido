import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import ContributionLinkForm from './ContributionLinkForm.vue'

// Mock external dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
  }),
}))

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  }),
}))

const mockRouter = {
  push: vi.fn(),
}
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}))

describe('ContributionLinkForm', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(ContributionLinkForm, {
      props: {
        contributionLinkData: {},
        editContributionLink: false,
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          BForm: true,
          BRow: true,
          BCol: true,
          BFormGroup: true,
          BFormInput: true,
          BFormTextarea: true,
          BFormSelect: true,
          BButton: true,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Div Element ".contribution-link-form"', () => {
    expect(wrapper.find('div.contribution-link-form').exists()).toBe(true)
  })

  describe('onReset', () => {
    it('resets the form data', async () => {
      wrapper.vm.form = {
        name: 'name',
        memo: 'memo',
        amount: 100,
        validFrom: 'validFrom',
        validTo: 'validTo',
        cycle: 'ONCE',
        maxPerCycle: 1,
        maxAmountPerMonth: 100,
      }
      await wrapper.vm.$nextTick()
      await wrapper.vm.onReset()
      expect(wrapper.vm.form).toEqual({
        validTo: null,
        validFrom: null,
      })
    })
  })

  describe('onSubmit', () => {
    const validFormData = {
      validFrom: '2022-6-18',
      validTo: '2022-7-18',
      name: 'test name',
      memo: 'test memo',
      amount: '100',
      cycle: 'ONCE',
      maxPerCycle: 1,
      maxAmountPerMonth: '0',
    }

    beforeEach(async () => {
      wrapper.vm.form = validFormData
    })

    it('calls the API and toasts success message on successful submission', async () => {
      mockMutate.mockResolvedValue({
        data: {
          createContributionLink: {
            link: 'https://localhost/redeem/CL-1a2345678',
          },
        },
      })

      await wrapper.vm.onSubmit()

      expect(mockMutate).toHaveBeenCalledWith({
        ...validFormData,
        id: null,
      })

      expect(mockToastSuccess).toHaveBeenCalledWith('https://localhost/redeem/CL-1a2345678')
    })

    it('toasts an error message on API error', async () => {
      mockMutate.mockRejectedValue({ message: 'OUCH!' })

      await wrapper.vm.onSubmit()

      expect(mockToastError).toHaveBeenCalledWith('OUCH!')
    })

    it('shows error when validFrom is not set', async () => {
      wrapper.vm.form = { ...validFormData, validFrom: null }
      await wrapper.vm.$nextTick()
      await wrapper.vm.onSubmit()
      expect(mockToastError).toHaveBeenCalledWith('contributionLink.noStartDate')
    })

    it('shows error when validTo is not set', async () => {
      wrapper.vm.form = { ...validFormData, validTo: null }
      await wrapper.vm.$nextTick()
      await wrapper.vm.onSubmit()
      expect(mockToastError).toHaveBeenCalledWith('contributionLink.noEndDate')
    })
  })
})
