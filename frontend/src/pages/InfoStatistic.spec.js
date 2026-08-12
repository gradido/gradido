import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import InfoStatistic from './InfoStatistic.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { listContributionLinks, searchAdminUsers } from '@/graphql/queries'
import { creationGroups } from '@/graphql/contributions.graphql'
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
      result: mockQueryImplementation(query).result,
    }
  },
}))

const CREATION_GROUPS = [
  { id: 1, tag: 'feuerwehr', name: 'Feuerwehr' },
  { id: 2, tag: 'musik', name: null },
  { id: 3, tag: 'chor', name: 'Chor' },
]

const ADMIN_USERS = [
  {
    firstName: 'Peter',
    lastName: 'Lustig',
    role: 'ADMIN',
    visibleCreationGroups: [],
    seesAllCreationGroups: true,
    seesUntagged: true,
  },
  {
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    role: 'MODERATOR',
    visibleCreationGroups: ['feuerwehr'],
    seesAllCreationGroups: false,
    seesUntagged: false,
  },
  {
    firstName: 'Garrick',
    lastName: 'Ollivander',
    role: 'MODERATOR_AI',
    visibleCreationGroups: ['feuerwehr', 'musik'],
    seesAllCreationGroups: false,
    seesUntagged: false,
  },
  {
    firstName: 'Super',
    lastName: 'Admin',
    role: 'MODERATOR',
    visibleCreationGroups: [],
    seesAllCreationGroups: true,
    seesUntagged: true,
  },
]

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
          'community.groupsAndModerators': 'Creation groups and moderators',
          'community.moderatorsAllGroups': 'For all groups',
          'community.moderatorsUntagged': 'Contributions without a group',
          'community.noModerators': 'No moderator yet',
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
      result: query === creationGroups ? ref({ creationGroups: CREATION_GROUPS }) : ref(null),
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
                userCount: ADMIN_USERS.length,
                userList: ADMIN_USERS,
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

  // Group functions: moderators are listed under the groups they look after.
  describe('groups and moderators', () => {
    it('names every group, with and without a display name', async () => {
      await wrapper.vm.$nextTick()
      // The wallet shows the group name only; a group without a name falls back to its tag.
      expect(wrapper.text()).toContain('Feuerwehr')
      expect(wrapper.text()).not.toContain('#feuerwehr')
      expect(wrapper.text()).toContain('#musik')
      expect(wrapper.text()).toContain('Chor')
      expect(wrapper.text()).not.toContain('#chor')
    })

    it('lists a moderator under each group they may see', async () => {
      await wrapper.vm.$nextTick()
      const sections = wrapper.findAll('.mb-3')
      const firefighters = sections.find((section) => section.text().includes('Feuerwehr'))
      const music = sections.find((section) => section.text().includes('#musik'))
      expect(firefighters.text()).toContain('Bibi Bloxberg')
      // A moderator with several groups appears under each of them.
      expect(firefighters.text()).toContain('Garrick Ollivander')
      expect(music.text()).toContain('Garrick Ollivander')
      expect(music.text()).not.toContain('Bibi Bloxberg')
    })

    it('includes KI-Moderatoren, who are moderators with Crea', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Garrick Ollivander')
    })

    it('puts an unassigned moderator under "for all groups", not under a single group', async () => {
      await wrapper.vm.$nextTick()
      const sections = wrapper.findAll('.mb-3')
      const allGroups = sections.find((section) => section.text().includes('For all groups'))
      const firefighters = sections.find((section) => section.text().includes('Feuerwehr'))
      expect(allGroups.text()).toContain('Super Admin')
      expect(firefighters.text()).not.toContain('Super Admin')
    })

    it('marks a group that has no moderator yet', async () => {
      await wrapper.vm.$nextTick()
      const sections = wrapper.findAll('.mb-3')
      const choir = sections.find((section) => section.text().includes('Chor'))
      expect(choir.text()).toContain('No moderator yet')
    })

    it('leaves out the untagged heading while nobody is scoped that way', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Contributions without a group')
    })

    // A scope can cover a group AND the contributions that carry none. "No group" is not a
    // group, so it never shows up in visibleCreationGroups -- reading the heading off an empty
    // tag list would drop exactly this moderator from the page.
    it('lists a moderator who looks after a group and the ungrouped ones under both', async () => {
      const mixed = [
        {
          firstName: 'Mira',
          lastName: 'Muster',
          role: 'MODERATOR',
          visibleCreationGroups: ['feuerwehr'],
          seesAllCreationGroups: false,
          seesUntagged: true,
        },
      ]
      mockQueryImplementation.mockImplementation((query) => ({
        result: query === creationGroups ? ref({ creationGroups: CREATION_GROUPS }) : ref(null),
        onResult: (callback) => {
          if (query === searchAdminUsers) {
            callback({
              data: { searchAdminUsers: { userCount: mixed.length, userList: mixed } },
            })
          }
        },
        onError: vi.fn(),
      }))
      const localWrapper = mount(InfoStatistic, {
        global: { plugins: [router, i18n], stubs: { BContainer, BLink } },
      })
      await localWrapper.vm.$nextTick()
      const sections = localWrapper.findAll('.mb-3')
      const firefighters = sections.find((section) => section.text().includes('Feuerwehr'))
      const untagged = sections.find((section) =>
        section.text().includes('Contributions without a group'),
      )
      expect(firefighters.text()).toContain('Mira Muster')
      expect(untagged.text()).toContain('Mira Muster')
    })

    it('keeps administrators out of the group listing', async () => {
      await wrapper.vm.$nextTick()
      const sections = wrapper.findAll('.mb-3')
      expect(sections.every((section) => !section.text().includes('Peter Lustig'))).toBe(true)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockQueryImplementation.mockImplementation(() => ({
        result: ref(null),
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
