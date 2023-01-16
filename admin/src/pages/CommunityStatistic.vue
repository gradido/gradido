<template>
  <div class="community-statistic">
    <statistic-table v-model="statistics" />
  </div>
</template>
<script>
import { communityStatistics } from '@/graphql/communityStatistics.js'
import StatisticTable from '../components/Tables/StatisticTable.vue'

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
        const totals = { ...communityStatistics.totalAvailable }
        this.statistics = { ...communityStatistics, ...totals }
        this.activeUsers = this.statistics.totalAvailable.activeUsers
        this.totalGradidoAvailable = this.statistics.totalAvailable.totalGradidoAvailable
        this.totalGradidoUnbookedDecayed =
          this.statistics.totalAvailable.totalGradidoUnbookedDecayed
        delete this.totalAvailable
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
}
</script>
