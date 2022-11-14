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
  methods: {
    getCommunityStatistics() {
      this.$apollo
        .query({
          query: communityStatistics,
        })
        .then((result) => {
          this.statistics.totalUsers = result.data.communityStatistics.totalUsers
          this.statistics.activeUsers = result.data.communityStatistics.activeUsers
          this.statistics.deletedUsers = result.data.communityStatistics.deletedUsers
          this.statistics.totalGradidoCreated = result.data.communityStatistics.totalGradidoCreated
          this.statistics.totalGradidoDecayed = result.data.communityStatistics.totalGradidoDecayed
          this.statistics.totalGradidoAvailable =
            result.data.communityStatistics.totalGradidoAvailable
          this.statistics.totalGradidoUnbookedDecayed =
            result.data.communityStatistics.totalGradidoUnbookedDecayed
        })
        .catch(() => {
          this.toastError('communityStatistics has no result, use default data')
        })
    },
  },
  created() {
    this.getCommunityStatistics()
  },
}
</script>
