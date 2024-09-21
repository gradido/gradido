import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import InfoStatistic from './InfoStatistic.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { listContributionLinks, searchAdminUsers } from '@/graphql/queries'
import { BContainer, BLink } from 'bootstrap-vue-next'

const mockToastError = vi.fn()
vi.mock('../composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

const mockQueryImplementation = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (query) => {
    return {
      onResult: mockQueryImplementation(query).onResult,
      onError: mockQueryImplementation(query).onError,
    }
  },
}))

describe('InfoStatistic', () => {
  let wrapper
  let router
  let i18n

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [],
    })

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          communityInfo: 'Community Info',
          'community.admins': 'Admins',
          'community.moderators': 'Moderators',
          contact: 'Contact',
        },
      },
    })

    vi.mock('@/config', () => ({
      default: {
        COMMUNITY_DESCRIPTION: 'Test Community',
        COMMUNITY_URL: 'https://test.com',
        COMMUNITY_SUPPORT_MAIL: 'support@test.com',
      },
    }))

    mockQueryImplementation.mockImplementation((query) => ({
      onResult: (callback) => {
        if (query === listContributionLinks) {
          callback({
            data: {
              listContributionLinks: {
                count: 2,
                links: [
                  { id: 1, amount: 200, name: 'Dokumenta 2017', memo: 'Memo 1', cycle: 'ONCE' },
                  { id: 2, amount: 200, name: 'Dokumenta 2022', memo: 'Memo 2', cycle: 'ONCE' },
                ],
              },
            },
          })
        } else if (query === searchAdminUsers) {
          callback({
            data: {
              searchAdminUsers: {
                userCount: 2,
                userList: [
                  { firstName: 'Peter', lastName: 'Lustig', role: 'ADMIN' },
                  { firstName: 'Super', lastName: 'Admin', role: 'MODERATOR' },
                ],
              },
            },
          })
        }
      },
      onError: vi.fn(),
    }))

    wrapper = mount(InfoStatistic, {
      global: {
        plugins: [router, i18n],
        stubs: {
          BContainer,
          BLink,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the info page', () => {
    expect(wrapper.find('div.info-statistic').exists()).toBe(true)
  })

  it('displays community information', () => {
    expect(wrapper.text()).toContain('Test Community')
    expect(wrapper.text()).toContain('https://test.com')
  })

  it('displays admin and moderator information', async () => {
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Peter Lustig')
    expect(wrapper.text()).toContain('Super Admin')
  })

  it('displays contact information', () => {
    expect(wrapper.text()).toContain('support@test.com')
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockQueryImplementation.mockImplementation((query) => ({
        onResult: vi.fn(),
        onError: (errorCallback) => {
          errorCallback(new Error('API Error'))
        },
      }))

      wrapper = mount(InfoStatistic, {
        global: {
          plugins: [router, i18n],
          stubs: {
            BContainer: true,
            BLink: true,
          },
        },
      })
    })

    it('toasts error messages', async () => {
      await wrapper.vm.$nextTick()
      expect(mockToastError).toHaveBeenCalledWith(
        'listContributionLinks has no result, use default data',
      )
      expect(mockToastError).toHaveBeenCalledWith(
        'searchAdminUsers has no result, use default data',
      )
    })
  })
})
