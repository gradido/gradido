import { communityGroupTags } from '@/graphql/contributions.graphql'
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
  messages: {
    en: {
      contribution: { communityWindow: 'Contributions from the last {months} months' },
    },
  },
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
      windowMonths: 6,
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

  // The list asks two different queries. Handing the same answer to both would hide which
  // one the group dropdown actually reads — and reading the canonical list there instead of
  // the community one is precisely the mistake this component must not make.
  const communityGroups = ref({
    communityGroupTags: [
      { id: 1, tag: 'choir', name: 'Choir' },
      { id: 2, tag: 'fire', name: null },
    ],
  })

  describe('mount', () => {
    beforeEach(() => {
      vi.mocked(useQuery).mockImplementation((query) => {
        if (query === communityGroupTags) {
          return { result: communityGroups, loading: ref(false) }
        }
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

    // Contributions already show "(no group)" as their label, so the filter has to offer
    // it too -- otherwise you can see the state but never single it out. BFormSelect is
    // registered app-wide rather than imported, so the test puts its own stand-in there to
    // read the options off.
    it('offers all, all groups and no group before the real groups', () => {
      const SelectStub = {
        name: 'ThemedSelect',
        props: ['options', 'modelValue'],
        template: '<select></select>',
      }
      const localWrapper = mount(ContributionListAll, {
        global: { ...global, stubs: { ...global.stubs, ThemedSelect: SelectStub } },
      })
      const options = localWrapper.findComponent(SelectStub).props('options')
      expect(options.slice(0, 3).map((option) => option.value)).toEqual([
        null,
        '*grouped',
        '*untagged',
      ])
    })

    // The dropdown must offer exactly what can be found behind it. It therefore reads the
    // windowed list, not the canonical one -- a group that has been quiet longer than the
    // window would otherwise lead into an empty result and read as "nothing going on here".
    it('takes its groups from the windowed list, not the canonical one', () => {
      const SelectStub = {
        name: 'ThemedSelect',
        props: ['options', 'modelValue'],
        template: '<select></select>',
      }
      const localWrapper = mount(ContributionListAll, {
        global: { ...global, stubs: { ...global.stubs, ThemedSelect: SelectStub } },
      })
      const options = localWrapper.findComponent(SelectStub).props('options')
      // The wallet shows the group name only; a group without a name falls back to its tag.
      expect(options.slice(3)).toEqual([
        { value: 'choir', text: 'Choir' },
        { value: 'fire', text: '#fire' },
      ])
    })

    // Stated where it applies, and taken from the answer the backend gave -- a duration
    // written down a second time in the wallet would keep claiming the old number the day
    // the window changes.
    it('states the window the backend actually filtered by', () => {
      expect(wrapper.find('[data-test="community-window"]').text()).toBe(
        'Contributions from the last 6 months',
      )
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
