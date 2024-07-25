<template>
  <div class="contribution-link">
    <contribution-link :items="items" :count="count" @get-contribution-links="refetch" />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { listContributionLinks } from '@/graphql/listContributionLinks.js'
import ContributionLink from '../components/ContributionLink/ContributionLink'
import { useAppToast } from '@/composables/useToast'

const { toastError } = useAppToast()

const { result, error, refetch } = useQuery(listContributionLinks, null, {
  fetchPolicy: 'network-only',
})

const items = computed(() => {
  return result.value?.listContributionLinks?.links
})

const count = computed(() => {
  return result.value?.listContributionLinks?.count
})

watch(error, () => {
  toastError('listContributionLinks has no result, use default data')
})
</script>
