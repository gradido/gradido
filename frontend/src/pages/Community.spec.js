import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import Community from './Community'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import { listContributions, listAllContributions, openCreations } from '@/graphql/queries'
import { useRoute, useRouter } from 'vue-router'
import { useAppToast } from '@/composables/useToast'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BTab, BTabs } from 'bootstrap-vue-next'
import { reactive, ref } from 'vue'

// Mock external dependencies
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { tab: 'contribute' } })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
    toastInfo: vi.fn(),
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key) => key,
  })),
}))

vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    value: ref(''),
    errorMessage: ref(''),
    handleChange: vi.fn(),
    meta: reactive({
      valid: true,
      touched: false,
      dirty: false,
    }),
  })),
  useForm: vi.fn(() => ({
    handleSubmit: vi.fn(),
    errors: reactive({}),
    resetForm: vi.fn(),
  })),
  defineRule: vi.fn(),
}))

// Mock child components
vi.mock('@/components/Contributions/OpenCreationsAmount', () => ({
  default: {
    name: 'OpenCreationsAmount',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/ContributionForm', () => ({
  default: {
    name: 'ContributionForm',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/ContributionList', () => ({
  default: {
    name: 'ContributionList',
    template: '<div></div>',
  },
}))

describe('Community', () => {
  let wrapper
  let mockRouter
  let mockToast

  const mockOpenCreationsQuery = vi.fn()
  const mockListContributionsQuery = vi.fn()
  const mockListAllContributionsQuery = vi.fn()
  const mockCreateContributionMutation = vi.fn()
  const mockUpdateContributionMutation = vi.fn()
  const mockDeleteContributionMutation = vi.fn()

  beforeEach(() => {
    mockRouter = { push: vi.fn() }
    vi.mocked(useRouter).mockReturnValue(mockRouter)

    mockToast = {
      toastError: vi.fn(),
      toastSuccess: vi.fn(),
      toastInfo: vi.fn(),
    }
    vi.mocked(useAppToast).mockReturnValue(mockToast)

    vi.mocked(useQuery).mockImplementation((query) => {
      if (query === openCreations) return { onResult: mockOpenCreationsQuery, refetch: vi.fn() }
      if (query === listContributions)
        return { onResult: mockListContributionsQuery, refetch: vi.fn() }
      if (query === listAllContributions)
        return { onResult: mockListAllContributionsQuery, refetch: vi.fn() }
    })

    vi.mocked(useMutation).mockImplementation((mutation) => {
      if (mutation === createContribution) return { mutate: mockCreateContributionMutation }
      if (mutation === updateContribution) return { mutate: mockUpdateContributionMutation }
      if (mutation === deleteContribution) return { mutate: mockDeleteContributionMutation }
    })

    const { defineRule } = require('vee-validate')
    defineRule('required', (value) => !!value)

    wrapper = mount(Community, {
      global: {
        mocks: {
          $t: (key) => key, // Mock $t function
          $d: (date) => date.toISOString(), // Mock $d function if needed
        },
        components: {
          BTabs,
        },
        stub: {
          BTab: true,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('mount', () => {
    it('initializes with correct data', () => {
      expect(wrapper.vm.tabIndex).toBe(0)
      expect(wrapper.vm.items).toEqual([])
      expect(wrapper.vm.itemsAll).toEqual([])
    })

    it('fetches initial data', () => {
      expect(mockOpenCreationsQuery).toHaveBeenCalled()
      expect(mockListContributionsQuery).toHaveBeenCalled()
      expect(mockListAllContributionsQuery).toHaveBeenCalled()
    })
  })

  describe('tabs', () => {
    it('has three tabs', () => {
      expect(wrapper.findAll('.tabs')).toHaveLength(1)
      expect(wrapper.findAll('btab')).toHaveLength(3)
    })

    it.skip('updates tab index when route changes', async () => {
      vi.mocked(useRoute).mockReturnValue({ params: { tab: 'contributions' } })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.tabIndex).toBe(1)
    })
  })

  describe('handleSaveContribution', () => {
    it('calls createContributionMutation and shows success toast on success', async () => {
      const contributionData = { date: '2023-09-12', memo: 'Test contribution', amount: '100' }
      mockCreateContributionMutation.mockResolvedValue({ data: { createContribution: true } })

      await wrapper.vm.handleSaveContribution(contributionData)

      expect(mockCreateContributionMutation).toHaveBeenCalledWith({
        creationDate: contributionData.date,
        memo: contributionData.memo,
        amount: contributionData.amount,
      })
      expect(mockToast.toastSuccess).toHaveBeenCalledWith('contribution.submitted')
    })

    it('shows error toast on failure', async () => {
      const contributionData = { date: '2023-09-12', memo: 'Test contribution', amount: '100' }
      mockCreateContributionMutation.mockRejectedValue(new Error('Create Contribution failed!'))

      await wrapper.vm.handleSaveContribution(contributionData)

      expect(mockToast.toastError).toHaveBeenCalledWith('Create Contribution failed!')
    })
  })

  describe('handleUpdateContribution', () => {
    it('calls updateContributionMutation and shows success toast on success', async () => {
      const contributionData = {
        id: 1,
        date: '2023-09-12',
        memo: 'Updated contribution',
        amount: '200',
      }
      mockUpdateContributionMutation.mockResolvedValue({ data: { updateContribution: true } })

      await wrapper.vm.handleUpdateContribution(contributionData)

      expect(mockUpdateContributionMutation).toHaveBeenCalledWith({
        contributionId: contributionData.id,
        creationDate: contributionData.date,
        memo: contributionData.memo,
        amount: contributionData.amount,
      })
      expect(mockToast.toastSuccess).toHaveBeenCalledWith('contribution.updated')
    })

    it('shows error toast on failure', async () => {
      const contributionData = {
        id: 1,
        date: '2023-09-12',
        memo: 'Updated contribution',
        amount: '200',
      }
      mockUpdateContributionMutation.mockRejectedValue(new Error('Update Contribution failed!'))

      await wrapper.vm.handleUpdateContribution(contributionData)

      expect(mockToast.toastError).toHaveBeenCalledWith('Update Contribution failed!')
    })
  })

  describe('handleDeleteContribution', () => {
    it('calls deleteContributionMutation and shows success toast on success', async () => {
      const contributionData = { id: 1 }
      mockDeleteContributionMutation.mockResolvedValue({ data: { deleteContribution: true } })

      await wrapper.vm.handleDeleteContribution(contributionData)

      expect(mockDeleteContributionMutation).toHaveBeenCalledWith({ id: contributionData.id })
      expect(mockToast.toastSuccess).toHaveBeenCalledWith('contribution.deleted')
    })

    it('shows error toast on failure', async () => {
      const contributionData = { id: 1 }
      mockDeleteContributionMutation.mockRejectedValue(new Error('Delete Contribution failed!'))

      await wrapper.vm.handleDeleteContribution(contributionData)

      expect(mockToast.toastError).toHaveBeenCalledWith('Delete Contribution failed!')
    })
  })

  describe('handleUpdateContributionForm', () => {
    it('updates form data and changes tab', () => {
      const contributionData = {
        id: 2,
        contributionDate: '2023-09-12',
        memo: 'Test contribution',
        amount: '300',
      }

      wrapper.vm.handleUpdateContributionForm(contributionData)

      expect(wrapper.vm.form).toEqual({
        id: 2,
        date: '2023-09-12',
        memo: 'Test contribution',
        amount: '300',
        hours: 15, // 300 / 20
      })
      expect(wrapper.vm.tabIndex).toBe(0)
      expect(mockRouter.push).toHaveBeenCalledWith({ params: { tab: 'contribute' } })
    })
  })

  describe('updateStatus', () => {
    it('updates status of a contribution', async () => {
      wrapper.vm.items[0] = { id: 1, status: 'IN_PROGRESS' }

      wrapper.vm.updateStatus(1)

      expect(wrapper.vm.items[0].status).toBe('PENDING')
    })
  })
})
