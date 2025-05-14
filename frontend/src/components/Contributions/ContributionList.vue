<template>
  <div v-if="items.length === 0 && !loading">
    <div v-if="currentPage === 1">
      {{ emptyText }}
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
          :all-contribution="allContribution"
          :messages-visible="openMessagesListId === item.id"
          @toggle-messages-visible="toggleMessagesVisible(item.id)"
          @update-contribution-form="updateContributionForm"
          @contribution-changed="refetch()"
        />
      </div>
    </div>
  </div>
  <BPagination
    v-if="isPaginationVisible"
    :model-value="currentPage"
    class="mt-3"
    pills
    size="lg"
    :per-page="pageSize"
    :total-rows="contributionCount"
    align="center"
    :hide-ellipsis="true"
    @update:model-value="updatePage"
  />
</template>
<script setup>
import { ref, computed, nextTick } from 'vue'
import ContributionListItem from '@/components/Contributions/ContributionListItem.vue'
import { listContributions, listAllContributions } from '@/graphql/contributions.graphql'
import { useQuery } from '@vue/apollo-composable'
import { PAGE_SIZE } from '@/constants'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import CONFIG from '@/config'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  allContribution: {
    type: Boolean,
    required: false,
    default: false,
  },
  emptyText: {
    type: String,
    required: false,
    default: '',
  },
})

// composables
const { toastError, toastSuccess } = useAppToast()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// constants
const pageSize = PAGE_SIZE
const pollInterval = CONFIG.AUTO_POLL_INTERVAL || undefined

// refs
const currentPage = computed(() => Number(route.params.page) || 1)
const openMessagesListId = ref(null)

// queries
const { result, loading, refetch, onResult } = useQuery(
  props.allContribution ? listAllContributions : listContributions,
  () => ({
    pagination: {
      currentPage: currentPage.value,
      pageSize,
      order: 'DESC',
    },
    messagePagination: !props.allContribution
      ? {
          currentPage: 1,
          pageSize: 10,
          order: 'ASC',
        }
      : undefined,
  }),
  { fetchPolicy: 'cache-and-network', pollInterval },
)

// events
const emit = defineEmits(['update-contribution-form'])

// computed
const contributionListResult = computed(() => {
  return props.allContribution
    ? result.value?.listAllContributions
    : result.value?.listContributions
})
const contributionCount = computed(() => {
  return contributionListResult.value?.contributionCount || 0
})
const items = computed(() => {
  return [...(contributionListResult.value?.contributionList || [])]
})
const isPaginationVisible = computed(() => {
  return (contributionCount.value > pageSize || currentPage.value > 1) && !loading.value
})

// callbacks
onResult(({ data }) => {
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
const updatePage = (page) => {
  router.push({ params: { page } })
}
</script>
