<template>
  <div>
    <ul class="list-unstyled list-group mb-3">
      <li
        v-for="space in spaces"
        :key="space.id"
        :title="space.description"
        :class="[
          'list-group-item',
          'list-group-item-action',
          'd-flex',
          'justify-content-between',
          'align-items-center',
          'cursor-pointer',
          { active: space.id === selectedSpaceId },
        ]"
        @click="chooseSpace(space)"
      >
        <div>
          <input v-model="selectedSpaceId" type="radio" :value="space.id" class="me-2" />
          {{ space.name }}
        </div>
        <a :href="space.url" target="_blank" @click.stop>
          {{ $t('projectBranding.openSpaceInHumhub') }}
        </a>
      </li>
    </ul>
    <b-pagination
      v-if="result && pagination.total > ITEMS_PER_PAGE"
      v-model="pagination.page"
      :total-rows="pagination.total"
      :per-page="ITEMS_PER_PAGE"
      aria-controls="list-humhub-spaces"
      @update:model-value="refetch({ page: $event })"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { spaces as spacesQuery } from '@/graphql/projectBranding.graphql'
import { useQuery } from '@vue/apollo-composable'

const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['chooseSpace'])
function chooseSpace(space) {
  selectedSpaceId.value = space.id
  emit('chooseSpace', space)
}

const ITEMS_PER_PAGE = 20
const page = ref(1)
const selectedSpaceId = ref(props.modelValue)
const { result, refetch } = useQuery(spacesQuery, { page: page.value, limit: ITEMS_PER_PAGE })

const spaces = computed(() => result.value?.spaces?.results || [])
const pagination = computed(() => result.value?.spaces?.pagination || {})

onMounted(() => {
  if (props.modelValue) {
    if (!spaces.value.some((space) => space.id === props.modelValue)) {
      const targetPage = Math.ceil(props.modelValue / ITEMS_PER_PAGE)
      page.value = targetPage
      refetch({ page: targetPage })
    }
  }
})
</script>
<style scoped>
.list-group-item-action:hover:not(.active) {
  background-color: #ececec;
  color: #0056b3;
  transition: background-color 0.2s ease-in-out;
}

.list-group-item-action.active > a {
  color: white;
}
</style>
