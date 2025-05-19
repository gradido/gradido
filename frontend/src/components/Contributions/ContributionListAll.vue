<template>
  <div v-if="items.length === 0 && !loading">
    <div v-if="currentPage === 1">
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
import { computed, ref } from 'vue'
import ContributionListAllItem from '@/components/Contributions/ContributionListAllItem.vue'
import { listAllContributions } from '@/graphql/contributions.graphql'
import { useQuery } from '@vue/apollo-composable'
import CONFIG from '@/config'
import PaginatorRouteParamsPage from '@/components/PaginatorRouteParamsPage.vue'
import { PAGE_SIZE } from '@/constants'
import { useRoute } from 'vue-router'

const route = useRoute()

// constants
const pollInterval = CONFIG.AUTO_POLL_INTERVAL || undefined
const pageSize = PAGE_SIZE

// computed
const currentPage = ref(Number(route.params.page) || 1)

const { result, loading } = useQuery(
  listAllContributions,
  () => ({
    pagination: {
      currentPage: currentPage.value,
      pageSize,
      order: 'DESC',
    },
  }),
  {
    fetchPolicy: 'cache-and-network',
    pollInterval,
  },
)

const contributionCount = computed(() => {
  return result.value?.listAllContributions.contributionCount || 0
})
const items = computed(() => {
  return [...(result.value?.listAllContributions.contributionList || [])]
})
</script>
