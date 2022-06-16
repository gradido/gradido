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
    <contribution-link :items="items" :count="count" />
  </div>
</template>
<script>
import { listContributionLinks } from '@/graphql/listContributionLinks.js'
import ContributionLink from '../components/ContributionLink.vue'
import { listUnconfirmedContributions } from '../graphql/listUnconfirmedContributions'

export default {
  name: 'overview',
  components: {
    ContributionLink,
  },
  data() {
    return {
      items: [],
      count: 0,
    }
  },
  methods: {
    async getPendingCreations() {
      this.$apollo
        .query({
          query: listUnconfirmedContributions,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.$store.commit('setOpenCreations', result.data.listUnconfirmedContributions.length)
        })
    },
    async getContributionLinks() {
      this.$apollo
        .query({
          query: listContributionLinks,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.count = result.data.listContributionLinks.count
          this.items = result.data.listContributionLinks.links
        })
        .catch(() => {
          this.toastError('listContributionLinks has no result, use default data')
        })
    },
  },
  created() {
    this.getPendingCreations()
    this.getContributionLinks()
  },
}
</script>
