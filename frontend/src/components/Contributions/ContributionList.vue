<template>
  <div v-if="items.length === 0 && !loading">
    <div v-if="currentPage === 1">
      {{ t('contribution.noContributions.myContributions') }}
    </div>
    <div v-else>
      {{ t('contribution.noContributions.emptyPage') }}
    </div>
  </div>
  <div v-else class="contribution-list">
    <div v-for="item in items" :key="item.id + 'a'" class="mb-3">
      <div :id="`contributionListItem-${item.id}`">
        <contribution-list-item
          v-bind="item"
          :contribution-id="item.id"
          :messages-visible="openMessagesListId === item.id"
          @toggle-messages-visible="toggleMessagesVisible(item.id)"
          @update-contribution-form="updateContributionForm"
          @contribution-changed="refetch()"
        />
      </div>
    </div>
  </div>
  <paginator-route-params-page
    v-model="currentPage"
    :page-size="pageSize"
    :total-count="contributionCount"
    :loading="loading"
  />
</template>
<script setup>
import { ref, computed, nextTick } from 'vue'
import ContributionListItem from '@/components/Contributions/ContributionListItem.vue'
import { listContributions } from '@/graphql/contributions.graphql'
import { useQuery } from '@vue/apollo-composable'
import { PAGE_SIZE } from '@/constants'
import { useI18n } from 'vue-i18n'
import CONFIG from '@/config'
import { useRoute } from 'vue-router'
import PaginatorRouteParamsPage from '@/components/PaginatorRouteParamsPage.vue'

const route = useRoute()

// composables
const { t } = useI18n()

// constants
const pageSize = PAGE_SIZE
const pollInterval = CONFIG.AUTO_POLL_INTERVAL || undefined

// events
const emit = defineEmits(['update-contribution-form'])

// refs
const currentPage = ref(1)
const openMessagesListId = ref(null)

// queries
const { result, loading, refetch, onResult } = useQuery(
  listContributions,
  {
    pagination: {
      currentPage: currentPage.value,
      pageSize,
      order: 'DESC',
    },
    messagePagination: {
      currentPage: 1,
      pageSize: 10,
      order: 'ASC',
    },
  },
  {
    fetchPolicy: 'cache-and-network',
    pollInterval,
  },
)

// computed
const contributionCount = computed(() => {
  return result.value?.listContributions.contributionCount || 0
})
const items = computed(() => {
  return [...(result.value?.listContributions.contributionList || [])]
})

// callbacks
// scroll to anchor, if hash ist present in url and after data where loaded
onResult(({ _data }) => {
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
const toggleMessagesVisible = (contributionId) => {
  if (openMessagesListId.value === contributionId) {
    openMessagesListId.value = 0
  } else {
    openMessagesListId.value = contributionId
  }
}
const updateContributionForm = (item) => {
  emit('update-contribution-form', { item, page: currentPage.value })
}
</script>
