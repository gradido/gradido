<template>
  <div class="community-switch">
    <div v-if="!validCommunityIdentifier">
      <BDropdown no-flip :text="modelValue?.name">
        <BDropdownItem
          v-for="community in communities"
          :key="community.id"
          :title="community.description"
          :active="modelValue?.uuid === community.uuid"
          @click.prevent="updateCommunity(community)"
        >
          {{ community.name }}
        </BDropdownItem>
      </BDropdown>
    </div>
    <div v-else class="mb-4 mt-2">
      <BRow>
        <BCol class="fw-bold" :title="modelValue.description">{{ modelValue.name }}</BCol>
      </BRow>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUpdated } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import { selectCommunities } from '@/graphql/queries'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const { toastError } = useAppToast()

const communities = ref([])
const validCommunityIdentifier = ref(false)

const { onResult } = useQuery(selectCommunities)

onResult(({ data }) => {
  if (data) {
    communities.value = data.communities
    setDefaultCommunity()
  }
})

const communityIdentifier = computed(() => route.params.communityIdentifier)

function updateCommunity(community) {
  emit('update:model-value', community)
}

function setDefaultCommunity() {
  if (communityIdentifier.value && communities.value.length >= 1) {
    const foundCommunity = communities.value.find((community) => {
      if (
        community.uuid === communityIdentifier.value ||
        community.name === communityIdentifier.value
      ) {
        validCommunityIdentifier.value = true
        return true
      }
      return false
    })
    if (foundCommunity) {
      updateCommunity(foundCommunity)
      return
    }
    toastError('invalid community identifier in url')
  }

  if (validCommunityIdentifier.value && !communityIdentifier.value) {
    validCommunityIdentifier.value = false
  }

  if (props.modelValue?.uuid === '' && communities.value.length) {
    const foundCommunity = communities.value.find((community) => !community.foreign)
    if (foundCommunity) {
      updateCommunity(foundCommunity)
    }
  }
}

onMounted(setDefaultCommunity)
</script>
