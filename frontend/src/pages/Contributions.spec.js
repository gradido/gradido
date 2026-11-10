import { useAppToast } from '@/composables/useToast'
import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { BTab, BTabs } from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoute, useRouter } from 'vue-router'
import {
  firstLoginWindow,
  forgetFirstLoginWindows,
  holdAccountWindowsForThisSession,
  holdFirstCreationForThisSession,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'
import { Contributions } from './Contributions'

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
  ContributionEdit: {
    name: 'ContributionEdit',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/ContributionCreate', () => ({
  ContributionCreate: {
    name: 'ContributionCreate',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/ContributionList', () => ({
  ContributionList: {
    name: 'ContributionList',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/ContributionListAll', () => ({
  ContributionListAll: {
    name: 'ContributionListAll',
    template: '<div></div>',
  },
}))

vi.mock('@/components/Contributions/NavContributions', () => ({
  NavContributions: {
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

  /**
   * E-045 (Bernd, 08.11.2026): whoever opens "Schöpfen" wants to create. The windows about the
   * member that waited for the next start -- after a thank-you (E-044) or after an event link
   * (KA-015) -- come now, the name before the first creation (ES-003). With the real windows
   * module: which window has the screen is its answer, not the page's.
   */
  describe('the windows that wait for the next start', () => {
    const mountPage = () =>
      mount(Contributions, {
        global: { mocks: { $t: (key) => key }, components: { BTabs, BTab } },
      })

    afterEach(() => {
      // The windows live in a module, which outlives a test.
      forgetFirstLoginWindows()
    })

    it('come once the page is built, the name before the first creation', () => {
      holdAccountWindowsForThisSession()
      setFirstLoginWindowWanted('alias', true)
      setFirstLoginWindowWanted('firstCreation', true)
      // The fixture proves itself: held, neither of them shows.
      expect(firstLoginWindow.value).toBeNull()

      const page = mountPage()

      expect(firstLoginWindow.value).toBe('alias')
      setFirstLoginWindowWanted('alias', false)
      expect(firstLoginWindow.value).toBe('firstCreation')
      page.unmount()
    })

    it('lets the first creation come that waited behind the invitation onto the map', () => {
      holdFirstCreationForThisSession()
      setFirstLoginWindowWanted('firstCreation', true)
      expect(firstLoginWindow.value).toBeNull()

      const page = mountPage()

      expect(firstLoginWindow.value).toBe('firstCreation')
      page.unmount()
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
