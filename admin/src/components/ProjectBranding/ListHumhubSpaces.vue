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
        @click="selectedSpaceId = space.id"
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
      v-if="result && result.spaces.total > ITEMS_PER_PAGE"
      v-model="result.spaces.page"
      :total-rows="result.spaces.total"
      :per-page="ITEMS_PER_PAGE"
      aria-controls="list-humhub-spaces"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const ITEMS_PER_PAGE = 20
const page = ref(1)
const selectedSpaceId = ref(props.modelValue)
const { result, refetch } = useQuery(
  gql`
    query spaces($page: Int!) {
      spaces(page: $page) {
        total
        page
        pages
        results {
          id
          name
          description
          url
        }
      }
    }
  `,
  { page: page.value, limit: ITEMS_PER_PAGE },
)

const spaces = computed(() => result.value?.spaces?.results || [])

watch(
  () => selectedSpaceId.value,
  (newValue) => emit('update:modelValue', newValue),
)

watch(
  () => props.modelValue,
  (newValue) => {
    console.log('space id updated, new value:', newValue)
  },
)

onMounted(() => {
  console.log('on mounted', props.modelValue)
  if (props.spaceId) {
    const targetPage = Math.ceil(props.spaceId / ITEMS_PER_PAGE)
    page.value = targetPage
    refetch({ page: targetPage })
  }
})

const prevPage = () => {
  if (page.value > 1) {
    page.value -= 1
    refetch({ page: page.value })
  }
}

const nextPage = () => {
  if (hasMore.value) {
    page.value += 1
    refetch({ page: page.value })
  }
}
</script>
<style scoped>
.list-group-item-action:hover:not(.active) {
  background-color: #ececec;
  color: #0056b3;
  transition: background-color 0.2s ease-in-out;
}
</style>
