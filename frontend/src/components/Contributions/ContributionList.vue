<template>
  <div class="contribution-list">
    <div v-for="item in items" :key="item.id + 'a'" class="mb-3">
      <contribution-list-item
        v-if="item.status === 'IN_PROGRESS'"
        v-bind="item"
        :contribution-id="item.id"
        :all-contribution="allContribution"
        @close-all-open-collapse="$emit('close-all-open-collapse')"
        @update-contribution-form="updateContributionForm"
        @delete-contribution="deleteContribution"
        @update-status="updateStatus"
      />
    </div>
    <div v-for="item2 in items" :key="item2.id" class="mb-3">
      <contribution-list-item
        v-if="item2.status !== 'IN_PROGRESS'"
        v-bind="item2"
        :contribution-id="item2.id"
        :all-contribution="allContribution"
        @close-all-open-collapse="$emit('close-all-open-collapse')"
        @update-contribution-form="updateContributionForm"
        @delete-contribution="deleteContribution"
        @update-status="updateStatus"
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
import { ref, computed, watch } from 'vue'
import ContributionListItem from '@/components/Contributions/ContributionListItem.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  contributionCount: {
    type: Number,
    required: true,
  },
  showPagination: {
    type: Boolean,
    required: true,
  },
  pageSize: {
    type: Number,
    default: 25,
  },
  allContribution: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits([
  'update-list-contributions',
  'update-contribution-form',
  'delete-contribution',
  'update-status',
])

const currentPage = ref(1)
const messages = ref([])

const isPaginationVisible = computed(() => {
  return props.showPagination && props.pageSize < props.contributionCount
})

watch(currentPage, () => {
  updateListContributions()
})

const updateListContributions = () => {
  emit('update-list-contributions', {
    currentPage: currentPage.value,
    pageSize: props.pageSize,
  })
  window.scrollTo(0, 0)
}

const updateContributionForm = (item) => {
  emit('update-contribution-form', item)
}

const deleteContribution = (item) => {
  emit('delete-contribution', item)
}

const updateStatus = (id) => {
  emit('update-status', id)
}
</script>
