import { useAppToast } from '@/composables/useToast'
import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { BTab, BTabs } from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoute, useRouter } from 'vue-router'
import Contributions from './Contributions'

// Mock external dependencies
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { tab: 'contribute' } })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastInfo: vi.fn(),
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key) => key,
  })),
}))

vi.mock('@/components/Contributions/ContributionEdit', () => ({
  default: {
    name: 'ContributionEdit',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/ContributionCreate', () => ({
  default: {
    name: 'ContributionCreate',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/ContributionList', () => ({
  default: {
    name: 'ContributionList',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/ContributionListAll', () => ({
  default: {
    name: 'ContributionListAll',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/NavContributions', () => ({
  default: {
    name: 'NavContributions',
    template: '<div></div>',
  },
}))

describe('Contributions', () => {
  let wrapper
  let mockRouter
  let mockToast

  const mockCountContributionsInProgress = vi.fn()

  beforeEach(() => {
    mockRouter = { push: vi.fn() }
    vi.mocked(useRouter).mockReturnValue(mockRouter)

    mockToast = {
      toastInfo: vi.fn(),
    }
    vi.mocked(useAppToast).mockReturnValue(mockToast)

    vi.mocked(useQuery).mockImplementation((query) => ({
      onResult: mockCountContributionsInProgress,
    }))

    wrapper = mount(Contributions, {
      global: {
        mocks: {
          $t: (key) => key, // Mock $t function
        },
        components: {
          BTabs,
          BTab,
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
    })
  })

  describe('tabs', () => {
    it('has three tabs', () => {
      expect(wrapper.findAll('.tabs')).toHaveLength(1)
      expect(wrapper.findAllComponents(BTab)).toHaveLength(3)
    })

    it.skip('updates tab index when route changes', async () => {
      vi.mocked(useRoute).mockReturnValue({ params: { tab: 'contributions' } })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.tabIndex).toBe(1)
    })
  })

  describe('handleUpdateContributionForm', () => {
    it('updates form data and changes tab', () => {
      const contributionData = {
        item: { id: 2, contributionDate: '2023-09-12', memo: 'Test contribution', amount: '300' },
        page: 2,
      }

      wrapper.vm.handleUpdateContributionForm(contributionData)

      expect(wrapper.vm.itemData).toEqual({
        id: 2,
        contributionDate: '2023-09-12',
        memo: 'Test contribution',
        amount: '300',
      })
      expect(wrapper.vm.tabIndex).toBe(0)
      expect(mockRouter.push).toHaveBeenCalledWith({ params: { tab: 'contribute' } })
    })
  })
})
