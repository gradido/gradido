<template>
  <BPagination
    v-if="isPaginationVisible"
    :model-value="currentPage"
    class="mt-3"
    pills
    size="lg"
    :per-page="pageSize"
    :total-rows="totalCount"
    align="center"
    :hide-ellipsis="true"
    @update:model-value="updatePage"
  />
</template>
<script setup>
import { computed } from 'vue'
import CONFIG from '@/config'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    required: false,
    default: CONFIG.PAGE_SIZE,
  },
  totalCount: {
    type: Number,
    required: true,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits(['update:model-value'])

const isPaginationVisible = computed(() => {
  return (props.totalCount > props.pageSize || props.modelValue > 1) && !props.loading
})
const currentPage = computed(() => Number(route.params.page) || props.modelValue)
const updatePage = (page) => {
  router.push({ params: { page } })
  emit('update:model-value', page)
}
</script>
