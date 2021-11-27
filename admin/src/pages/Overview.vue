<template>
  <div>
    <b-card
      v-show="$store.state.openCreations > 0"
      border-variant="primary"
      header="offene Schöpfungen"
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
      header="keine offene Schöpfungen"
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
    <br />
    <hr />
    <br />
    <b-list-group>
      <b-list-group-item class="bg-secondary text-light" href="user">
        zur Usersuche
      </b-list-group-item>
      <b-list-group-item class="d-flex justify-content-between align-items-center">
        Mitglieder
        <b-badge class="bg-success" pill>2400</b-badge>
      </b-list-group-item>

      <b-list-group-item class="d-flex justify-content-between align-items-center">
        aktive Mitglieder
        <b-badge class="bg-primary" pill>2201</b-badge>
      </b-list-group-item>

      <b-list-group-item class="d-flex justify-content-between align-items-center">
        nicht bestätigte Mitglieder
        <b-badge class="bg-warning text-dark" pill>120</b-badge>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>
<script>
import { getPendingCreations } from '../graphql/getPendingCreations'

export default {
  name: 'overview',
  methods: {
    async getPendingCreations() {
      this.$apollo
        .query({
          query: getPendingCreations,
        })
        .then((result) => {
          this.$store.commit('resetOpenCreations')
          this.$store.commit('openCreationsPlus', result.data.getPendingCreations.length)
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
  created() {
    this.getPendingCreations()
  },
}
</script>
