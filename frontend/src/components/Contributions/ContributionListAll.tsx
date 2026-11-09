// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BFormInput } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  type ContributionAllRow,
  ContributionListAllItem,
} from '@/components/Contributions/ContributionListAllItem'
import type { CreationGroup } from '@/components/Contributions/ContributionListItem'
import PaginatorRouteParamsPage from '@/components/PaginatorRouteParamsPage.vue'
import ThemedSelect from '@/components/ThemedSelect.vue'
import CONFIG from '@/config'
import { PAGE_SIZE } from '@/constants'
import {
  communityCreationGroups as communityCreationGroupsQuery,
  listAllContributions,
} from '@/graphql/contributions.graphql'
import { creationGroupLabel } from '@/utils/creationGroupLabel'

/** The community's contributions of the last months, a page at a time, with search and filter. */
export const ContributionListAll = defineComponent({
  name: 'ContributionListAll',
  setup(_, { expose }) {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()

    // constants
    const pollInterval = CONFIG.AUTO_POLL_INTERVAL || undefined
    const pageSize = PAGE_SIZE

    const currentPage = ref(Number(route.params.page) || 1)

    // Group functions: search by text or by the submitter's name, plus a group filter. The
    // typed text is debounced so a query does not go out on every keystroke; any change returns
    // to the first page, otherwise one could end up on an empty page of a smaller result.
    const searchInput = ref('')
    const searchText = ref('')
    const selectedGroup = ref<string | null>(null)
    let searchTimer: ReturnType<typeof setTimeout> | undefined

    // The paginator reads the page from the route, not from this ref, so returning to the
    // first page has to move the route as well - otherwise the list shows page one while the
    // paginator still highlights the old page and a click on it does nothing.
    const backToFirstPage = () => {
      currentPage.value = 1
      if (Number(route.params.page) > 1) {
        router.push({ params: { page: 1 } })
      }
    }

    watch(searchInput, (value) => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(() => {
        searchText.value = value
        backToFirstPage()
      }, 400)
    })
    watch(selectedGroup, () => {
      backToFirstPage()
    })

    const isFiltered = computed(() => Boolean(searchText.value || selectedGroup.value))

    // Only the groups this list currently has something to show for, so the dropdown offers
    // exactly what can be found behind it. A group that has been quiet longer than the window
    // drops out and returns by itself once one of its contributions is filed again. The
    // submission field keeps asking creationGroups — every group has to stay choosable there, or a
    // dormant one could never be woken up.
    const { result: creationGroupsResult } = useQuery(communityCreationGroupsQuery)
    const groupOptions = computed(() => [
      // Three answers that cover the list exactly once: everything, everything that belongs
      // to some group, everything that belongs to none. The last two are reserved tokens the
      // backend matches; a real slug can never be '*…', so they cannot collide.
      { value: null, text: t('contribution.filter.all') },
      { value: '*grouped', text: t('contribution.filter.grouped') },
      { value: '*untagged', text: t('contribution.filter.noGroup') },
      ...(creationGroupsResult.value?.communityCreationGroups ?? []).map(
        (group: CreationGroup) => ({
          value: group.tag,
          text: creationGroupLabel(group),
        }),
      ),
    ])

    const { result, loading } = useQuery(
      listAllContributions,
      () => ({
        pagination: {
          currentPage: currentPage.value,
          pageSize,
          order: 'DESC',
        },
        filter: {
          query: searchText.value || null,
          creationGroup: selectedGroup.value,
        },
      }),
      {
        fetchPolicy: 'cache-and-network',
        pollInterval,
      },
    )

    // Served by the backend rather than written down here a second time: the heading must state
    // the window that is really in force, or it starts telling a lie the day the window changes.
    const windowMonths = computed<number | null>(
      () => result.value?.listAllContributions?.windowMonths ?? null,
    )

    const contributionCount = computed<number>(
      () => result.value?.listAllContributions.contributionCount || 0,
    )
    const items = computed<ContributionAllRow[]>(() => [
      ...(result.value?.listAllContributions.contributionList || []),
    ])

    expose({ currentPage })

    return () => (
      <>
        {/* The window is stated where it applies, and it is the number the backend actually
            filters by — never a duration written into an explanatory text, which would keep
            claiming the old number if the window ever changed. */}
        {windowMonths.value ? (
          <div class='text-muted small mb-2' data-test='community-window'>
            {t('contribution.communityWindow', { months: windowMonths.value })}
          </div>
        ) : null}
        <div class='contribution-filter d-flex flex-wrap gap-2 mb-3'>
          <BFormInput
            modelValue={searchInput.value}
            class='contribution-filter-search'
            placeholder={t('contribution.filter.search')}
            onUpdate:modelValue={(value) => {
              searchInput.value = String(value)
            }}
          />
          <ThemedSelect
            modelValue={selectedGroup.value}
            class='contribution-filter-group'
            options={groupOptions.value}
            aria-label={t('contribution.filter.byGroup')}
            onUpdate:modelValue={(value: string | null) => {
              selectedGroup.value = value
            }}
          />
        </div>
        {items.value.length === 0 && !loading.value ? (
          <div class='page-text'>
            {isFiltered.value ? (
              <div>{t('contribution.filter.noResults')}</div>
            ) : currentPage.value === 1 ? (
              <div>{t('contribution.noContributions.allContributions')}</div>
            ) : (
              <div>{t('contribution.noContributions.emptyPage')}</div>
            )}
          </div>
        ) : (
          <div class='contribution-list-all'>
            {items.value.map((item) => (
              <div key={`${item.id}a`} class='mb-3'>
                <div id={`contributionListItem-${item.id}`}>
                  <ContributionListAllItem {...item} />
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginatorRouteParamsPage
          modelValue={currentPage.value}
          totalCount={contributionCount.value}
          loading={loading.value}
          pageSize={pageSize}
          onUpdate:modelValue={(page: number) => {
            currentPage.value = page
          }}
        />
      </>
    )
  },
})
