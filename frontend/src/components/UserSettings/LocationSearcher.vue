<template>
  <BInputGroup class="search-container">
    <BFormInput
      :model-value="searchQuery"
      @update:model-value="searchQuery = $event"
      @input="debouncedSearch"
      @keyup.enter="selectFirstResult"
      @keydown.down="navigateResults(1)"
      @keydown.up="navigateResults(-1)"
      placeholder="Search for a location"
    />
    <template #append>
      <BButton @click="debouncedSearch" variant="outline-secondary">
        <IBiSearch />
      </BButton>
    </template>
    <BListGroup v-if="searchResults.length > 0" class="search-results">
      <BListGroupItem
        v-for="(result, index) in searchResults"
        :key="index"
        @click="selectResult(result)"
        :active="index === selectedResultIndex"
        href="#"
        class="search-result-item"
      >
        {{ result.display_name }}
      </BListGroupItem>
    </BListGroup>
  </BInputGroup>
</template>

<script setup>
import { ref, watch } from 'vue'
import { BInputGroup, BFormInput, BButton, BListGroup, BListGroupItem } from 'bootstrap-vue-next'

const props = defineProps({
  initialValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['locationSelected'])

const searchQuery = ref(props.initialValue)
const searchResults = ref([])
const selectedResultIndex = ref(-1)

const debouncedSearch = async () => {
  if (searchQuery.value.length < 3) {
    searchResults.value = []
    return
  }
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}`,
    )
    const data = await response.json()
    searchResults.value = data
    selectedResultIndex.value = -1
  } catch (error) {
    console.error('Error searching for location:', error)
    searchResults.value = []
  }
}

function selectResult(result) {
  emit('locationSelected', {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    name: result.display_name,
  })
  searchResults.value = []
  searchQuery.value = result.display_name
}

function selectFirstResult() {
  if (searchResults.value.length > 0) {
    selectResult(searchResults.value[0])
  }
}

function navigateResults(direction) {
  const newIndex = selectedResultIndex.value + direction
  if (newIndex >= -1 && newIndex < searchResults.value.length) {
    selectedResultIndex.value = newIndex
  }
}

watch(
  () => props.initialValue,
  (newValue) => {
    searchQuery.value = newValue
  },
)
</script>

<style scoped>
.search-container {
  position: relative;
}
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}
</style>
