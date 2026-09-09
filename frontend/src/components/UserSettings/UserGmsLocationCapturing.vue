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
import { useStore } from 'vuex'
import { configuredCommunityPoint, hasPosition } from '@/utils/matchingPosition'

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
  // Both points are nullable: an account may have no position, and an instance may have
  // no coordinates set. Neither may leave this map centred on `undefined` -- the
  // configured community point is the fallback, the same one the error case below takes.
  const community = hasPosition(locationData.communityLocation)
    ? {
        lat: locationData.communityLocation.latitude,
        lng: locationData.communityLocation.longitude,
      }
    : defaultLocation.value
  communityLocation.value = { ...community }

  userLocation.value.lng = locationData.userLocation?.longitude ?? community.lng
  userLocation.value.lat = locationData.userLocation?.latitude ?? community.lat
})

onError((err) => {
  userLocation.value = defaultLocation.value
  communityLocation.value = defaultLocation.value
  toastError(err.message)
})

const defaultLocation = computed(() => configuredCommunityPoint())

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
