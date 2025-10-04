<template>
  <div class="mb-3 p-3 card-user-search">
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
      <a href="https://gradido.net/gms1/" target="_blank">
        {{ $t('card-user-search.info') }}
      </a>
      <BRow class="my-1">
        <BCol cols="12">
          <div class="text-lg-end">
            <div v-if="gmsUserLocationExists">
              <BButton
                v-if="isUserSearchDisabled"
                :disabled="isUserSearchDisabled"
                variant="gradido"
                :href="gmsUri"
                target="_blank"
              >
                {{ $t('card-user-search.allowed.disabled-button') }}
              </BButton>
              <BButton v-else variant="gradido" :href="gmsUri" target="_blank">
                {{ $t('card-user-search.allowed.button') }}
              </BButton>
            </div>
            <div v-else>
              <RouterLink to="/settings/extern">
                <BButton variant="gradido">
                  {{ $t('card-user-search.not-allowed.button') }}
                </BButton>
              </RouterLink>
            </div>
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
const isUserSearchDisabled = ref(true)
/*
console.log(
  'store.state: gmsAllowed userLocation=',
  store.state.gmsAllowed,
  store.state.userLocation,
)
*/
// use computed to react on state change, when user goes to settings and change something an get back here
const gmsAllowed = computed(() => store.state.gmsAllowed)
// console.log('gmsAllowed=', gmsAllowed)
const gmsUserLocationExists = computed(() => store.state.userLocation !== null)
// console.log('gmsUserLocationExists=', gmsUserLocationExists)

const { onResult, result, loading, onError } = useQuery(authenticateGmsUserSearch, null, {
  fetchPolicy: 'network-only',
  enabled: true,
})

onResult(({ data }) => {
  if (gmsAllowed.value && gmsUserLocationExists.value && data !== undefined) {
    gmsUri.value = `${data.authenticateGmsUserSearch.url}?accesstoken=${data.authenticateGmsUserSearch.token}`
    isUserSearchDisabled.value = false
  }
})

onError(() => {
  isUserSearchDisabled.value = true
  if (gmsAllowed.value && gmsUserLocationExists.value) {
    // setting isUserSearchDisabled.value to true will show that GMS is offline, no need to further post to the user
    // toastError('authenticateGmsUserSearch failed!')
  } else if (gmsAllowed.value && !gmsUserLocationExists.value) {
    // toastError('capture your location first!')
    // eslint-disable-next-line no-console
    console.log('capture your location first...')
  }
})
</script>
<style scoped>
.container {
  background-attachment: scroll;
  background-position: left;
  background-repeat: no-repeat;
  background-size: 380px 100%;
  background-image: url('/img/svg/usersearchmap5.jpg') !important;
}
</style>
