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
    <automatic-creation :items="items" />
  </div>
</template>
<script>
import { getPendingCreations } from '../graphql/getPendingCreations'
import AutomaticCreation from '../components/AutomaticCreation.vue'

export default {
  name: 'overview',
  components: {
    AutomaticCreation,
  },
  data() {
    return {
      items: [
        { Name: 'John1', Text: 'Doe1 ', GDD: '200', startDate: '', endDate: '' },
        { Name: 'John2', Text: 'Doe2', GDD: '300', startDate: '', endDate: '' },
        { Name: 'John3', Text: 'Doe3', GDD: '400', startDate: '', endDate: '' },
      ],
    }
  },
  methods: {
    async getPendingCreations() {
      this.$apollo
        .query({
          query: getPendingCreations,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.$store.commit('setOpenCreations', result.data.getPendingCreations.length)
        })
    },
  },
  created() {
    this.getPendingCreations()
  },
}
</script>
