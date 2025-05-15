import { listAllContributions, listContributions } from '@/graphql/contributions.graphql'
import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import ContributionList from './ContributionList'
import { createRouter, createWebHistory } from 'vue-router'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: { template: '<div>Home</div>' },
    },
    {
      path: '/test',
      name: 'test',
      component: ContributionList,
    },
  ],
})

vi.mock('@/components/Contributions/ContributionListItem.vue', () => ({
  default: {
    name: 'ContributionListItem',
    template: '<div></div>',
  },
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}))

describe('ContributionList', () => {
  let wrapper

  const global = {
    plugins: [i18n, router],
    mocks: {
      $filters: {
        GDD: vi.fn((val) => val),
      },
    },
    stubs: {
      BPagination: true,
    },
  }

  const contributions = {
    contributionCount: 3,
    listContributions: [
      {
        id: 0,
        date: '07/06/2022',
        memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
        amount: '200',
        status: 'IN_PROGRESS',
      },
      {
        id: 1,
        date: '06/22/2022',
        memo: 'Ich habe 30 Stunden Frau Müller beim Einkaufen und im Haushalt geholfen.',
        amount: '600',
        status: 'CONFIRMED',
      },
      {
        id: 2,
        date: '05/04/2022',
        memo: 'Ich habe 50 Stunden den Nachbarkindern bei ihren Hausaufgaben geholfen und Nachhilfeunterricht gegeben.',
        amount: '1000',
        status: 'DENIED',
      },
    ],
  }

  const propsData = {
    allContribution: false,
    emptyText: '',
  }

  const allContributions = {
    contributionCount: 3,
    listAllContributions: [
      {
        id: 0,
        date: '07/06/2022',
        memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
        amount: '200',
        status: 'IN_PROGRESS',
      },
      {
        id: 1,
        date: '06/22/2022',
        memo: 'Ich habe 30 Stunden Frau Müller beim Einkaufen und im Haushalt geholfen.',
        amount: '600',
        status: 'CONFIRMED',
      },
      {
        id: 2,
        date: '05/04/2022',
        memo: 'Ich habe 50 Stunden den Nachbarkindern bei ihren Hausaufgaben geholfen und Nachhilfeunterricht gegeben.',
        amount: '1000',
        status: 'DENIED',
      },
    ],
  }

  const mountWrapper = () => {
    return mount(ContributionList, {
      propsData,
      global,
    })
  }

  describe('mount', () => {
    const mockListContributionsQuery = vi.fn()
    const mockListAllContributionsQuery = vi.fn()

    beforeEach(() => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === listContributions) {
          return {
            result: contributions,
            loading: vi.fn(),
            onResult: mockListContributionsQuery,
            refetch: vi.fn(),
          }
        }
        if (query === listAllContributions) {
          return {
            result: allContributions,
            loading: vi.fn(),
            onResult: mockListAllContributionsQuery,
            refetch: vi.fn(),
          }
        }
      })

      wrapper = mountWrapper()
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    describe('mount as user contributions list', () => {
      beforeEach(() => {
        propsData.allContribution = false
      })
      it('fetches initial data', () => {
        expect(mockListContributionsQuery).toHaveBeenCalled()
      })
    })

    describe('mount as all contributions list', () => {
      beforeEach(() => {
        propsData.allContribution = true
      })
      it('fetches initial data', () => {
        expect(mockListAllContributionsQuery).toHaveBeenCalled()
      })
    })

    it('has a DIV .contribution-list', () => {
      expect(wrapper.find('div.contribution-list').exists()).toBe(true)
    })

    describe('pagination', () => {
      describe('list count smaller than page size', () => {
        it('has no pagination buttons', () => {
          expect(wrapper.find('b-pagination-stub').exists()).toBe(false)
        })
      })

      describe('list count greater than page size', () => {
        beforeEach(async () => {
          contributions.contributionCount = 33
          // await wrapper.setProps({ contributionCount: 33 })
        })

        it('has pagination buttons', () => {
          expect(wrapper.find('b-pagination-stub').exists()).toBe(true)
        })
      })

      describe('switch page', () => {
        const scrollToMock = vi.fn()
        window.scrollTo = scrollToMock

        beforeEach(async () => {
          contributions.contributionCount = 33
          // await wrapper.setProps({ contributionCount: 33 })
          await wrapper.findComponent({ name: 'BPagination' }).vm.$emit('update:modelValue', 2)
        })

        it('emits update contribution list', () => {
          expect(wrapper.emitted('update-list-contributions')).toEqual([
            [{ currentPage: 2, pageSize: 25 }],
          ])
        })

        it('scrolls to top', () => {
          expect(scrollToMock).toHaveBeenCalledWith(0, 0)
        })
      })
    })

    describe('update contribution', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('update-contribution-form', 'item')
      })

      it('emits update contribution form', () => {
        expect(wrapper.emitted('update-contribution-form')).toEqual([['item']])
      })
    })

    describe('delete contribution', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('delete-contribution', { id: 2 })
      })

      it('emits delete contribution', () => {
        expect(wrapper.emitted('delete-contribution')).toEqual([[{ id: 2 }]])
      })
    })

    describe('update status', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('update-status', { id: 2 })
      })

      it('emits update status', () => {
        expect(wrapper.emitted('update-status')).toEqual([[{ id: 2 }]])
      })
    })
  })
})
