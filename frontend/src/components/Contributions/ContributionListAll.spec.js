import { listAllContributions } from '@/graphql/contributions.graphql'
import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import ContributionListAll from './ContributionListAll.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'

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
      component: ContributionListAll,
    },
  ],
})

vi.mock('@/components/Contributions/ContributionListAllItem.vue', () => ({
  default: {
    name: 'ContributionListAllItem',
    template: '<div></div>',
  },
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}))

describe('ContributionListAll', () => {
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

  const allContributions = ref({
    listAllContributions: {
      contributionCount: 3,
      contributionList: [
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
    },
  })

  const mountWrapper = () => {
    return mount(ContributionListAll, {
      global,
    })
  }

  const loading = ref(false)

  describe('mount', () => {
    beforeEach(() => {
      vi.mocked(useQuery).mockImplementation((query) => {
        return {
          result: allContributions,
          loading,
        }
      })

      wrapper = mountWrapper()
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    describe('mount as all contributions list', () => {
      it('fetches initial data', () => {
        expect(useQuery).toHaveBeenCalled()
      })
    })

    it('has a DIV .contribution-list-all', () => {
      expect(wrapper.find('div.contribution-list-all').exists()).toBe(true)
    })

    describe('pagination', () => {
      describe('list count smaller than page size', () => {
        it('has no pagination buttons', () => {
          expect(wrapper.find('b-pagination-stub').exists()).toBe(false)
        })
      })

      describe('list count greater than page size', () => {
        beforeEach(async () => {
          allContributions.value.listAllContributions.contributionCount = 33
        })

        it('has pagination buttons', () => {
          expect(wrapper.find('b-pagination-stub').exists()).toBe(true)
        })
      })

      describe('switch page', () => {
        const scrollToMock = vi.fn()
        window.scrollTo = scrollToMock

        beforeEach(async () => {
          allContributions.value.listAllContributions.contributionCount = 33
          await wrapper
            .findComponent({ name: 'PaginatorRouteParamsPage' })
            .vm.$emit('update:modelValue', 2)
        })

        it('updates current page', () => {
          expect(wrapper.vm.currentPage).toBe(2)
        })

        it.skip('scrolls to top', () => {
          expect(scrollToMock).toHaveBeenCalledWith(0, 0)
        })
      })
    })
  })
})
