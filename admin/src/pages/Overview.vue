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
import { listAutomaticCreations } from '@/graphql/listAutomaticCreations.js'
import AutomaticCreation from '../components/AutomaticCreation.vue'

export default {
  name: 'overview',
  components: {
    AutomaticCreation,
  },
  data() {
    return {
      items: [],
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
    async getAutomaticCreations() {
      this.$apollo
        .query({
          query: listAutomaticCreations,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.toastSuccess('TODO! change this.items')
        })
        .catch(() => {
          this.toastError('listAutomaticCreations has no result, use default data')
        })

      this.items = [
        {
          id: 1,
          name: 'Meditation',
          memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
          amount: '200',
          startDate: '2022-04-01',
          endDate: '2022-08-01',
          cycle: 'täglich',
          repetition: '3',
          maxAmount: 0,
          link: 'https://localhost/redeem/1a2345678',
        },
        {
          id: 2,
          name: 'Teamarbeit',
          memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt',
          amount: '300',
          startDate: '2022-04-01',
          endDate: '2022-12-01',
          cycle: 'monatlich',
          repetition: '2',
          maxAmount: 0,
          link: 'https://localhost/redeem/1b2345678',
        },
        {
          id: 3,
          name: 'Documenta Kassel 2022',
          memo: 'New Account Register by Documenta Kassel, Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt',
          amount: '400',
          startDate: '2022-06-18',
          endDate: '2022-10-01',
          cycle: 'null',
          repetition: '1',
          maxAmount: 0,
          link: 'https://localhost/redeem/1c2345678',
        },
      ]
    },
  },
  created() {
    this.getPendingCreations()
    this.getAutomaticCreations()
  },
}
</script>
