import { listContributions, myContributionCreationGroups } from '@/graphql/contributions.graphql'
import { print } from 'graphql'
import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import ContributionList from './ContributionList'
import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      contribution: {
        noContributions: {
          myContributions: 'No contributions',
          emptyPage: 'No contributions',
        },
      },
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
      component: ContributionList,
    },
  ],
})

vi.mock('@/components/Contributions/ContributionListItem.vue', () => ({
  default: {
    name: 'ContributionListItem',
    // ⚠️ The stub declares the group prop and prints it. That is what lets a test see the
    // seam: the item is handed the whole row with v-bind="item", so a field of the query
    // becomes a prop by NAME alone -- nothing imports one from the other. A stub that
    // rendered an empty div could not tell whether the field arrived at all.
    props: ['creationGroups'],
    template: '<div>{{ (creationGroups ?? []).map((g) => g.name).join(", ") }}</div>',
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

  const contributions = ref({
    listContributions: {
      contributionCount: 3,
      contributionList: [
        {
          id: 0,
          date: '07/06/2022',
          memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
          amount: '200',
          status: 'IN_PROGRESS',
          // A real contribution carries its group. Without it the fixture could not show
          // that the field survives the trip from the query into the item.
          creationGroups: [{ tag: 'choir', name: 'Choir' }],
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
    return mount(ContributionList, {
      global,
    })
  }

  const loading = ref(false)

  const myGroups = ref({
    myContributionCreationGroups: [
      { id: 1, tag: 'choir', name: 'Choir' },
      { id: 2, tag: 'fire', name: null },
    ],
  })

  describe('mount', () => {
    const mockListContributionsQuery = vi.fn()

    beforeEach(() => {
      vi.mocked(useQuery).mockImplementation((query) => {
        // This tab asks two queries. Answering both the same way would hide which one the
        // group dropdown reads -- and reading the canonical list instead of the member's
        // own groups is precisely the mistake this component must not make.
        if (query === myContributionCreationGroups) {
          return { result: myGroups, loading: ref(false) }
        }
        return {
          result: contributions,
          loading,
          onResult: mockListContributionsQuery,
          refetch: vi.fn(),
        }
      })

      wrapper = mountWrapper()
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    describe('mount as user contributions list', () => {
      it('fetches initial data', () => {
        expect(mockListContributionsQuery).toHaveBeenCalled()
      })
    })

    it('has a DIV .contribution-list', () => {
      expect(wrapper.find('div.contribution-list').exists()).toBe(true)
    })

    // Both contribution tabs carry the same group filter, so both have to offer the same
    // three answers -- this tab was missed once, and the label it used had already been
    // renamed. BFormSelect is registered app-wide rather than imported, so the test puts
    // its own stand-in there to read the options off.
    it('offers all, all groups and no group before the real groups', () => {
      const SelectStub = {
        name: 'ThemedSelect',
        props: ['options', 'modelValue'],
        template: '<select></select>',
      }
      const localWrapper = mount(ContributionList, {
        global: { ...global, stubs: { ...global.stubs, ThemedSelect: SelectStub } },
      })
      const options = localWrapper.findComponent(SelectStub).props('options')
      // The real groups are asserted too: the three reserved answers alone would still
      // pass if the dropdown read the community-wide list instead of the member's own.
      expect(options.map((option) => option.value)).toEqual([
        null,
        '*grouped',
        '*untagged',
        'choir',
        'fire',
      ])
    })

    describe('pagination', () => {
      describe('list count smaller than page size', () => {
        it('has no pagination buttons', () => {
          expect(wrapper.find('b-pagination-stub').exists()).toBe(false)
        })
      })

      describe('list count greater than page size', () => {
        beforeEach(async () => {
          contributions.value.listContributions.contributionCount = 33
        })

        it('has pagination buttons', () => {
          expect(wrapper.find('b-pagination-stub').exists()).toBe(true)
        })
      })

      describe('switch page', () => {
        const scrollToMock = vi.fn()
        window.scrollTo = scrollToMock

        beforeEach(async () => {
          contributions.value.listContributions.contributionCount = 33
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

    describe('update contribution', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'ContributionListItem' })
          .vm.$emit('update-contribution-form', 'item')
      })

      it('emits update contribution form', () => {
        expect(wrapper.emitted('update-contribution-form')).toEqual([[{ item: 'item', page: 1 }]])
      })
    })

    // The seam itself: the group survives the trip from the query result into the item.
    it('hands the group down to the item', () => {
      expect(wrapper.text()).toContain('Choir')
    })
  })

  // ⚠️ The half a fixture cannot cover: that THIS query asks for the field under that very
  // name. Rename it in the document alone and the assertion above stays green, because the
  // fixture supplies the prop regardless.
  //
  // ⚠️ print(), not loc.source.body: the latter is the whole .graphql FILE, where four
  // queries select this field -- so it stayed green even with listContributions renamed.
  // print() renders just this operation.
  it('is the field this query actually selects', () => {
    expect(print(listContributions)).toMatch(/\bcreationGroups\s*\{/)
  })
})
