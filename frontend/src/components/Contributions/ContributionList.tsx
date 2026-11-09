// AI-GENERATED — not an architecture reference
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { BFormInput } from 'bootstrap-vue-next'
import { computed, defineComponent, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { ContributionEditItem } from '@/components/Contributions/ContributionEdit'
import {
  ContributionListItem,
  type ContributionRow,
  type CreationGroup,
} from '@/components/Contributions/ContributionListItem'
import PaginatorRouteParamsPage from '@/components/PaginatorRouteParamsPage.vue'
import ThemedSelect from '@/components/ThemedSelect.vue'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import CONFIG from '@/config'
import { PAGE_SIZE } from '@/constants'
import {
  myContributionCreationGroups as creationGroupsQuery,
  listContributions,
} from '@/graphql/contributions.graphql'
import { creationGroupLabel } from '@/utils/creationGroupLabel'

/** The member's own contributions, a page at a time, with search and group filter. */
export const ContributionList = defineComponent({
  name: 'ContributionList',
  emits: ['update-contribution-form'],
  setup(_, { emit, expose }) {
    const route = useRoute()
    const router = useRouter()

    // composables
    const { t } = useI18n()
    const { client: apolloClient } = useApolloClient()

    // constants
    const pageSize = PAGE_SIZE
    const pollInterval = CONFIG.AUTO_POLL_INTERVAL || undefined

    // refs
    const currentPage = ref(Number(route.params.page) || 1)
    const openMessagesListId = ref<number | null>(null)

    // Group functions: search by text and filter by group. The typed text is debounced so a
    // query does not go out on every keystroke; any change returns to the first page, otherwise
    // one could end up on an empty page of a smaller result.
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

    const { result: creationGroupsResult } = useQuery(creationGroupsQuery)
    const groupOptions = computed(() => [
      // Same three answers as the community tab: everything, everything that belongs to some
      // group, everything that belongs to none. The last two are reserved tokens the backend
      // matches; a real slug can never be '*…', so they cannot collide.
      { value: null, text: t('contribution.filter.all') },
      { value: '*grouped', text: t('contribution.filter.grouped') },
      { value: '*untagged', text: t('contribution.filter.noGroup') },
      ...(creationGroupsResult.value?.myContributionCreationGroups ?? []).map(
        (group: CreationGroup) => ({
          value: group.tag,
          text: creationGroupLabel(group),
        }),
      ),
    ])

    // queries
    const { result, loading, refetch, onResult } = useQuery(
      listContributions,
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

    // computed
    const contributionCount = computed<number>(
      () => result.value?.listContributions.contributionCount || 0,
    )
    const items = computed<ContributionRow[]>(() => [
      ...(result.value?.listContributions.contributionList || []),
    ])

    /**
     * The faces of everybody who wrote in one of these threads, fetched once for the page.
     *
     * Each message carries a date, not a picture (`userAvatarUpdatedAt`). Everything the wallet
     * already holds under that date needs nothing; on a second visit that is usually all of
     * them, and nothing is requested at all. Entries without a member behind them are dropped
     * by the composable.
     *
     * ⛔ HERE rather than in the thread component: the whole page's threads arrive in one
     * answer, and a fetch per opened thread would ask again for a moderator who wrote in three
     * of them. Same place, same reason, as the booking column's fetch in DashboardLayout.
     */
    onResult((answer) => {
      const contributions: ContributionRow[] =
        answer?.data?.listContributions?.contributionList ?? []
      const authors = contributions.flatMap((contribution) =>
        (contribution.messages ?? []).map((message) => ({
          gradidoID: message.userGradidoID,
          communityUuid: message.userCommunityUuid,
          avatarUpdatedAt: message.userAvatarUpdatedAt,
        })),
      )
      // Best effort, as everywhere: nobody loses their contribution list over a portrait.
      fetchMemberAvatars(apolloClient, authors)
    })

    // callbacks
    // scroll to anchor, if hash ist present in url and after data where loaded
    onResult(() => {
      nextTick(() => {
        if (!route.hash) {
          return
        }
        const el = document.querySelector(route.hash)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })

    // methods
    const toggleMessagesVisible = (contributionId: number) => {
      if (openMessagesListId.value === contributionId) {
        openMessagesListId.value = 0
      } else {
        openMessagesListId.value = contributionId
      }
    }
    const updateContributionForm = (item: ContributionEditItem) => {
      emit('update-contribution-form', { item, page: currentPage.value })
    }

    expose({ currentPage })

    return () => (
      <>
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
              <div>{t('contribution.noContributions.myContributions')}</div>
            ) : (
              <div>{t('contribution.noContributions.emptyPage')}</div>
            )}
          </div>
        ) : (
          <div class='contribution-list'>
            {items.value.map((item) => (
              <div key={`${item.id}a`} class='mb-3'>
                <div id={`contributionListItem-${item.id}`}>
                  <ContributionListItem
                    {...item}
                    contribution-id={item.id}
                    messagesVisible={openMessagesListId.value === item.id}
                    onToggle-messages-visible={() => toggleMessagesVisible(item.id)}
                    onUpdate-contribution-form={updateContributionForm}
                    onContribution-changed={() => refetch()}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginatorRouteParamsPage
          modelValue={currentPage.value}
          pageSize={pageSize}
          totalCount={contributionCount.value}
          loading={loading.value}
          onUpdate:modelValue={(page: number) => {
            currentPage.value = page
          }}
        />
      </>
    )
  },
})
