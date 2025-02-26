<template>
  <div class="mb-3 p-3 card-user-search">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('card-user-search.headline') }}</div>
      <div v-if="gmsAllowed" class="my-2 text-small">
        <span v-for="(line, lineNumber) of $t('card-user-search.allowed.text').split('\n')" :key="lineNumber">
          {{ line }}
          <br />
        </span>
      </div>
      <div v-else class="my-2 text-small">
        <span v-for="(line, lineNumber) of $t('card-user-search.not-allowed.text').split('\n')" :key="lineNumber">
          {{ line }}
          <br />
        </span>
      </div>
      <BRow class="my-1">
        <BCol cols="12">
          <div class="text-lg-end">
            <BButton v-if="gmsAllowed" variant="gradido" :href="gmsUri" target="_blank">
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
const gmsAllowed = computed(() => store.state.userLocation !== null)

const { onResult, result, loading, onError } = useQuery(authenticateGmsUserSearch)

onResult(({ data }) => {
  gmsUri.value = `${data.authenticateGmsUserSearch.url}?accesstoken=${data.authenticateGmsUserSearch.token}`
})

onError(() => {
  toastError('authenticateGmsUserSearch failed!')
})
</script>
