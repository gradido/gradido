<template>
  <div class="usersearch">
    <b-container class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('usersearch.headline') }}</div>
      <div class="my-4 text-small">
        <span v-for="(line, lineNumber) of $t('usersearch.text').split('\n')" :key="lineNumber">
          {{ line }}
          <br />
        </span>
      </div>
      <BRow class="my-5">
        <BCol cols="12">
          <div class="text-lg-right">
            <b-button variant="gradido" :href="gmsUri" target="_blank">
              {{ $t('usersearch.button') }}
            </b-button>
          </div>
        </BCol>
      </BRow>
    </b-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import { authenticateGmsUserSearch } from '@/graphql/queries'

const { useToast } = useAppToast()

const gmsUri = ref('not initialized')

const { onResult, result, loading, onError } = useQuery(authenticateGmsUserSearch)

onResult(({ data }) => {
  gmsUri.value = `${data.authenticateGmsUserSearch.url}?accesstoken=${data.authenticateGmsUserSearch.token}`
})

onError(() => {
  useToast.error('authenticateGmsUserSearch failed!')
})
</script>
