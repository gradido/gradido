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
  </div>
</template>
<script>
import { listUnconfirmedContributions } from '@/graphql/listUnconfirmedContributions.js'

export default {
  name: 'overview',
  methods: {
    getPendingCreations() {
      this.$apollo
        .query({
          query: listUnconfirmedContributions,
          // Wolle: cache statistics here? default is "fetchPolicy: 'network-only'"
        })
        .then((result) => {
          this.$store.commit('setOpenCreations', result.data.listUnconfirmedContributions.length)
        })
    },
  },
  created() {
    this.getPendingCreations()
  },
}
</script>
