<template>
  <div class="community-statistic">
    <statistic-table v-model="statistics" />
  </div>
</template>
<script>
import { communityStatistics } from '@/graphql/communityStatistics.js'
import StatisticTable from '../components/Tables/StatisticTable'

export default {
  name: 'CommunityStatistic',
  components: {
    StatisticTable,
  },
  data() {
    return {
      statistics: {
        totalUsers: null,
        activeUsers: null,
        deletedUsers: null,
        totalGradidoCreated: null,
        totalGradidoDecayed: null,
        totalGradidoAvailable: null,
        totalGradidoUnbookedDecayed: null,
      },
    }
  },
  apollo: {
    CommunityStatistics: {
      query() {
        return communityStatistics
      },
      update({ communityStatistics }) {
        const totals = { ...communityStatistics.dynamicStatisticsFields }
        this.statistics = { ...communityStatistics, ...totals }
        delete this.statistics.dynamicStatisticsFields
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
}
</script>
