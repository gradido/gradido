<template>
  <div class="usersearch">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('usersearch.headline') }}</div>
      <div class="my-4 text-small">
        <span v-for="(line, lineNumber) of $t('usersearch.text').split('\n')" :key="lineNumber">
          {{ line }}
          <br />
        </span>
      </div>
      <BRow class="my-5">
        <BCol cols="12">
          <div class="text-lg-end">
            <BButton variant="gradido" :href="gmsUri" target="_blank">
              {{ $t('usersearch.button') }}
            </BButton>
          </div>
        </BCol>
      </BRow>
    </BContainer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import { authenticateGmsUserSearch } from '@/graphql/queries'

const { toastError } = useAppToast()

const gmsUri = ref('not initialized')

const { onResult, result, loading, onError } = useQuery(authenticateGmsUserSearch)

onResult(({ data }) => {
  gmsUri.value = `${data.authenticateGmsUserSearch.url}?accesstoken=${data.authenticateGmsUserSearch.token}`
})

onError(() => {
  toastError('authenticateGmsUserSearch failed!')
})
</script>
