<template>
  <div class="admin-overview">
    <b-card
      v-show="$store.state.openCreations > 0"
      border-variant="primary"
      :header="$t('open_creations')"
      header-bg-variant="danger"
      header-text-variant="white"
      align="center"
    >
      <b-card-text>
        <b-link to="creation-confirm">
          <h1>{{ $store.state.openCreations }}</h1>
        </b-link>
      </b-card-text>
    </b-card>
    <b-card
      v-show="$store.state.openCreations < 1"
      border-variant="success"
      :header="$t('not_open_creations')"
      header-bg-variant="success"
      header-text-variant="white"
      align="center"
    >
      <b-card-text>
        <b-link to="creation-confirm">
          <h1>{{ $store.state.openCreations }}</h1>
        </b-link>
      </b-card-text>
    </b-card>
    <community-statistic class="mt-5" v-model="statistics" />
  </div>
</template>
<script>
import { communityStatistics } from '@/graphql/communityStatistics.js'
import CommunityStatistic from '../components/CommunityStatistic.vue'
import { listUnconfirmedContributions } from '@/graphql/listUnconfirmedContributions.js'

export default {
  name: 'overview',
  components: {
    CommunityStatistic,
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
    getPendingCreations() {
      this.$apollo
        .query({
          query: listUnconfirmedContributions,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.$store.commit('setOpenCreations', result.data.listUnconfirmedContributions.length)
        })
    },
    getCommunityStatistics() {
      this.$apollo
        .query({
          query: communityStatistics,
          // Wolle: cache statistics here? default is "fetchPolicy: 'network-only'"
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
    this.getPendingCreations()
    this.getCommunityStatistics()
  },
}
</script>
