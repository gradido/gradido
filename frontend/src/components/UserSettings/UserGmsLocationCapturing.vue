<template>
  <BButton @click="isModalOpen = !isModalOpen">{{ $t('settings.GMS.location.button') }}</BButton>
  <BModal :model-value="isModalOpen" fullscreen @update:modelValue="isModalOpen = !isModalOpen">
    <template #title>
      <h3>{{ $t('settings.GMS.map.headline') }}</h3>
    </template>
    <template #default>
      <BContainer class="bg-white appBoxShadow gradido-border-radius p-4 mt--3">
        <user-location-map
          v-if="isModalOpen"
          :user-marker-coords="userLocation"
          :community-marker-coords="communityLocation"
          @update:userPosition="updateUserLocation"
        />
      </BContainer>
    </template>
    <template #footer>
      <BButton variant="gradido" @click="saveUserLocation">
        {{ $t('settings.GMS.location.saveLocation') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import 'leaflet/dist/leaflet.css'
import { updateUserInfos } from '@/graphql/mutations'
import { useAppToast } from '@/composables/useToast'
import UserLocationMap from '@/components/UserSettings/UserLocationMap'
import { BButton, BModal } from 'bootstrap-vue-next'
import { userLocationQuery } from '@/graphql/queries'
import CONFIG from '@/config'
import { useStore } from 'vuex'

const { t } = useI18n()
const store = useStore()
const { mutate: updateUserInfo } = useMutation(updateUserInfos)
const { onResult, onError } = useQuery(userLocationQuery, {}, { fetchPolicy: 'network-only' })
const { toastSuccess, toastError } = useAppToast()

const capturedLocation = ref(null)
const isModalOpen = ref(false)
const userLocation = ref({ lat: 0, lng: 0 })
const communityLocation = ref({ lat: 0, lng: 0 })

const emit = defineEmits(['close'])

onResult(({ data }) => {
  const locationData = data.userLocation
  communityLocation.value.lng = locationData.communityLocation.longitude
  communityLocation.value.lat = locationData.communityLocation.latitude

  userLocation.value.lng = locationData.userLocation?.longitude ?? communityLocation.value.lng
  userLocation.value.lat = locationData.userLocation?.latitude ?? communityLocation.value.lat
})

onError((err) => {
  userLocation.value = defaultLocation.value
  communityLocation.value = defaultLocation.value
  toastError(err.message)
})

const defaultLocation = computed(() => {
  const defaultCommunityCoords = CONFIG.COMMUNITY_LOCATION.split(',')
  return {
    lat: parseFloat(defaultCommunityCoords[0]),
    lng: parseFloat(defaultCommunityCoords[1]),
  }
})

const saveUserLocation = async () => {
  try {
    const loc = { longitude: capturedLocation.value.lng, latitude: capturedLocation.value.lat }

    await updateUserInfo({ gmsLocation: loc })
    toastSuccess(t('settings.GMS.location.updateSuccess'))
    userLocation.value = capturedLocation.value
    // update in local storage to update button on overview
    store.commit('userLocation', loc)
    isModalOpen.value = false
  } catch (error) {
    toastError(error.message)
  }
}

const updateUserLocation = (currentUserLocation) => {
  capturedLocation.value = currentUserLocation
}
</script>
