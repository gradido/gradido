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
import { ref, computed, onMounted, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import { reachableCommunities } from '@/graphql/communities.graphql'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  communityIdentifier: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'communitiesLoaded'])

const route = useRoute()
const { toastError } = useAppToast()

const communities = ref([])
const validCommunityIdentifier = ref(false)

const { onResult } = useQuery(reachableCommunities)

onResult(({ data }) => {
  // console.log('CommunitySwitch.onResult...data=', data)
  if (data) {
    communities.value = data.reachableCommunities
    setDefaultCommunity()
    if (data.reachableCommunities.length === 1) {
      validCommunityIdentifier.value = true
    }
    emit('communitiesLoaded', data.reachableCommunities)
  }
})

const communityIdentifier = computed(
  () => route.params.communityIdentifier || props.communityIdentifier,
)

watch(
  () => communityIdentifier.value,
  () => {
    // console.log('CommunitySwitch.communityIdentifier.value', value)
    setDefaultCommunity()
  },
)

function updateCommunity(community) {
  // console.log('CommunitySwitch.updateCommunity...community=', community)
  emit('update:model-value', community)
}

function setDefaultCommunity() {
  // console.log(
  //   'CommunitySwitch.setDefaultCommunity... communityIdentifier= communities=',
  //   communityIdentifier,
  //   communities,
  // )
  if (communityIdentifier.value && communities.value.length >= 1) {
    // console.log(
    //   'CommunitySwitch.setDefaultCommunity... communities.value.length=',
    //   communities.value.length,
    // )
    const foundCommunity = communities.value.find((community) => {
      // console.log('CommunitySwitch.setDefaultCommunity... community=', community)
      if (
        community.uuid === communityIdentifier.value ||
        community.name === communityIdentifier.value
      ) {
        validCommunityIdentifier.value = true
        // console.log(
        //   'CommunitySwitch.setDefaultCommunity...true validCommunityIdentifier=',
        //   validCommunityIdentifier,
        // )
        return true
      }
      // console.log(
      //   'CommunitySwitch.setDefaultCommunity...false validCommunityIdentifier=',
      //   validCommunityIdentifier,
      // )
      return false
    })
    if (foundCommunity) {
      // console.log('CommunitySwitch.setDefaultCommunity...foundCommunity=', foundCommunity)
      updateCommunity(foundCommunity)
      return
    }
    toastError('invalid community identifier in url')
  }

  if (validCommunityIdentifier.value && !communityIdentifier.value) {
    validCommunityIdentifier.value = false
    // console.log(
    //   'CommunitySwitch.setDefaultCommunity...validCommunityIdentifier=',
    //   validCommunityIdentifier,
    // )
  }

  if (props.modelValue?.uuid === '' && communities.value.length) {
    // console.log(
    //   'CommunitySwitch.setDefaultCommunity...props.modelValue= communities=',
    //   props.modelValue,
    //   communities.value.length,
    // )
    const foundCommunity = communities.value.find((community) => !community.foreign)
    // console.log('CommunitySwitch.setDefaultCommunity...foundCommunity=', foundCommunity)
    if (foundCommunity) {
      updateCommunity(foundCommunity)
    }
  }
}

onMounted(setDefaultCommunity)
</script>
