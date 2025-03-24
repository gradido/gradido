<template>
  <div v-if="gmsActive" class="mb-3 p-3 card-user-search">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3 container">
      <div class="h3">{{ $t('card-user-search.headline') }}</div>
      <div v-if="gmsUserLocationExists" class="my-3 text-small">
        <span
          v-for="(line, lineNumber) of $t('card-user-search.allowed.text').split('\n')"
          :key="lineNumber"
        >
          {{ line }}
          <br />
        </span>
      </div>
      <div v-else class="my-3 text-small">
        <span
          v-for="(line, lineNumber) of $t('card-user-search.not-allowed.text').split('\n')"
          :key="lineNumber"
        >
          {{ line }}
          <br />
        </span>
      </div>
      <BRow class="my-1">
        <BCol cols="12">
          <div class="text-lg-end">
            <BButton
              v-if="gmsUserLocationExists"
              :disabled="isUserSearchDisabled"
              variant="gradido"
              :href="gmsUri"
              target="_blank"
            >
              {{ $t('card-user-search.allowed.button') }}
            </BButton>
            <RouterLink v-else to="/settings/extern">
              <BButton variant="gradido">
                {{ $t('card-user-search.not-allowed.button') }}
              </BButton>
            </RouterLink>
          </div>
        </BCol>
      </BRow>
    </BContainer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import { authenticateGmsUserSearch } from '@/graphql/queries'
import { useStore } from 'vuex'

const { toastError } = useAppToast()
const store = useStore()

const gmsUri = ref('not initialized')
// console.log('store.state: gmsActive gmsAllowed userLocation=', store.state.gmsActive, store.state.gmsAllowed, store.state.userLocation)
const gmsActive = store.state.gmsActive
// console.log('gmsActive=', gmsActive)
const gmsUserLocationExists = store.state.userLocation !== null
// console.log('gmsUserLocationExists=', gmsUserLocationExists)
const isUserSearchDisabled = computed(() => gmsUri.value !== null)

const { onResult, result, loading, onError } = useQuery(authenticateGmsUserSearch)

onResult(({ data }) => {
  if (gmsActive && gmsUserLocationExists && data !== undefined) {
    gmsUri.value = `${data.authenticateGmsUserSearch.url}?accesstoken=${data.authenticateGmsUserSearch.token}`
  }
})

onError(() => {
  if (gmsActive && gmsUserLocationExists) {
    toastError('authenticateGmsUserSearch failed!')
  } else if (gmsActive && !gmsUserLocationExists) {
    // toastError('capture your location first!')
    // eslint-disable-next-line no-console
    console.log('capture your location first...')
  }
})
</script>
<style scoped>
.container {
  background-attachment: absolute;
  background-position: left;
  background-repeat: no-repeat;
  background-size: 380px 180px;
  background-image: url('/img/svg/usersearchmap6.jpg') !important;
}
</style>
