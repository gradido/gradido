<template>
  <div>
    <div
      class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center profile-header"
      style="max-height: 200px"
    ></div>
    <b-container fluid class="mt--6">
      <b-row>
        <b-col class="order-xl-1">
          <gdd-table :transactions="transactions" @update-transactions="updateTransactions" />
        </b-col>
      </b-row>
      <b-row class="text-center mb-6" v-if="transactions.length == 0">
        <b-col class="h2">{{ $t('transaction.nullTransactions') }}</b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import GddTable from '../../views/Pages/AccountOverview/GddTable.vue'

export default {
  components: {
    GddTable,
  },
  props: {
    transactions: {
      default: [],
    },
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions')
    },
  },
}
</script>
<style></style>
