<template>
  <div class="community-statistic">
    <statistic-table v-if="!loading" :statistics="statistics" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { communityStatistics } from '@/graphql/communityStatistics'
import StatisticTable from '../components/Tables/StatisticTable'
import { useAppToast } from '@/composables/useToast'

const statistics = ref({
  totalUsers: null,
  activeUsers: null,
  deletedUsers: null,
  totalGradidoCreated: null,
  totalGradidoDecayed: null,
  totalGradidoAvailable: null,
  totalGradidoUnbookedDecayed: null,
})

const { result, loading, error } = useQuery(communityStatistics, () => ({}))
const { toastError } = useAppToast()

watch(
  result,
  () => {
    if (!result.value) return
    const totals = { ...result.value.communityStatistics.dynamicStatisticsFields }
    statistics.value = { ...result.value.communityStatistics, ...totals }
    delete statistics.value.dynamicStatisticsFields
  },
  { immediate: true },
)

watch(error, () => {
  if (error.value) {
    toastError(error.value.message)
  }
})
</script>
