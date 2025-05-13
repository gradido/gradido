<template>
  <div v-if="items.length === 0 && !loading">
    {{ emptyText }}
  </div>
  <div v-else class="contribution-list">
    <div v-for="item in items" :key="item.id + 'a'" class="mb-3">
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
      @update:model-value="currentPage = $event"
    />
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import ContributionListItem from '@/components/Contributions/ContributionListItem.vue'
import { listContributions, listAllContributions } from '@/graphql/contributions.graphql'
import { useQuery } from '@vue/apollo-composable'
import { PAGE_SIZE } from '@/constants'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import CONFIG from '@/config'

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

// constants
const pageSize = PAGE_SIZE
const pollInterval = CONFIG.AUTO_POLL_INTERVAL || undefined

// refs
const currentPage = ref(1)
const openMessagesListId = ref(null)

// queries
const { result, loading, refetch } = useQuery(
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
  return contributionCount.value > pageSize
})
const toggleMessagesVisible = (contributionId) => {
  if (openMessagesListId.value === contributionId) {
    openMessagesListId.value = 0
  } else {
    openMessagesListId.value = contributionId
  }
}

// methods
const updateContributionForm = (item) => {
  emit('update-contribution-form', item)
}
</script>
