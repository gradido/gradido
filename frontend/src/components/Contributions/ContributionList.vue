<template>
  <div v-if="items.length === 0 && !loading.value">
    {{ emptyText }}
  </div>
  <div v-else class="contribution-list">
    <div v-for="item in items" :key="item.id + 'a'" class="mb-3">
      <contribution-list-item
        v-bind="item"
        :contribution-id="item.id"
        :all-contribution="allContribution"
        @close-all-open-collapse="$emit('close-all-open-collapse')"
        @update-contribution-form="updateContributionForm"
        @delete-contribution="deleteContribution"
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
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import ContributionListItem from '@/components/Contributions/ContributionListItem.vue'
import { listContributions, listAllContributions } from '@/graphql/contributions.graphql'
import { useQuery } from '@vue/apollo-composable'
import { PAGE_SIZE } from '@/constants'

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

const emit = defineEmits([
  'close-all-open-collapse',
  'update-contribution-form',
  'delete-contribution',
])

const currentPage = ref(1)

const contributionListResult = computed(() => {
  return props.allContribution
    ? result.value?.listAllContributions
    : result.value?.listContributions
})

const contributionCount = computed(() => {
  return contributionListResult.value?.contributionCount || 0
})
const items = computed(() => {
  return contributionListResult.value?.contributionList || []
})

const isPaginationVisible = computed(() => {
  return PAGE_SIZE < contributionCount.value
})

const { result, loading } = useQuery(
  props.allContribution ? listAllContributions : listContributions,
  () => ({
    currentPage: currentPage.value,
    pageSize: PAGE_SIZE,
  }),
  { fetchPolicy: 'cache-and-network' },
)

const updateContributionForm = (item) => {
  emit('update-contribution-form', item)
}

const deleteContribution = (item) => {
  emit('delete-contribution', item)
}
</script>
