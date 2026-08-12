<template>
  <!-- The window is stated where it applies, and it is the number the backend actually
       filters by — never a duration written into an explanatory text, which would keep
       claiming the old number if the window ever changed. -->
  <div v-if="windowMonths" class="text-muted small mb-2" data-test="community-window">
    {{ $t('contribution.communityWindow', { months: windowMonths }) }}
  </div>
  <div class="contribution-filter d-flex flex-wrap gap-2 mb-3">
    <BFormInput
      v-model="searchInput"
      class="contribution-filter-search"
      :placeholder="$t('contribution.filter.search')"
    />
    <ThemedSelect
      v-model="selectedGroup"
      class="contribution-filter-group"
      :options="groupOptions"
      :aria-label="$t('contribution.filter.byGroup')"
    />
  </div>
  <div v-if="items.length === 0 && !loading">
    <div v-if="isFiltered">
      {{ $t('contribution.filter.noResults') }}
    </div>
    <div v-else-if="currentPage === 1">
      {{ $t('contribution.noContributions.allContributions') }}
    </div>
    <div v-else>
      {{ $t('contribution.noContributions.emptyPage') }}
    </div>
  </div>
  <div v-else class="contribution-list-all">
    <div v-for="item in items" :key="item.id + 'a'" class="mb-3">
      <div :id="`contributionListItem-${item.id}`">
        <contribution-list-all-item v-bind="item" />
      </div>
    </div>
  </div>
  <paginator-route-params-page
    v-model="currentPage"
    :total-count="contributionCount"
    :loading="loading"
    :page-size="pageSize"
  />
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import ContributionListAllItem from '@/components/Contributions/ContributionListAllItem.vue'
import {
  listAllContributions,
  communityCreationGroups as communityCreationGroupsQuery,
} from '@/graphql/contributions.graphql'
import { useQuery } from '@vue/apollo-composable'
import CONFIG from '@/config'
import PaginatorRouteParamsPage from '@/components/PaginatorRouteParamsPage.vue'
import { PAGE_SIZE } from '@/constants'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { creationGroupLabel } from '@/utils/creationGroupLabel'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// constants
const pollInterval = CONFIG.AUTO_POLL_INTERVAL || undefined
const pageSize = PAGE_SIZE

// computed
const currentPage = ref(Number(route.params.page) || 1)

// Group functions: search by text or by the submitter's name, plus a group filter. The
// typed text is debounced so a query does not go out on every keystroke; any change returns
// to the first page, otherwise one could end up on an empty page of a smaller result.
const searchInput = ref('')
const searchText = ref('')
const selectedGroup = ref(null)
let searchTimer = null

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
  ...(creationGroupsResult.value?.communityCreationGroups ?? []).map((group) => ({
    value: group.tag,
    text: creationGroupLabel(group),
  })),
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
const windowMonths = computed(() => result.value?.listAllContributions?.windowMonths ?? null)

const contributionCount = computed(() => {
  return result.value?.listAllContributions.contributionCount || 0
})
const items = computed(() => {
  return [...(result.value?.listAllContributions.contributionList || [])]
})
</script>
