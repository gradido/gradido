<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-transparent"></base-header>
    <b-container fluid class="mt--7">
      <gdd-status :row_form="row_form" />
      <br />
      <gdd-send
        :row_form="row_form"
        :row_check="row_check"
        :row_thx="row_thx"
        @change-rows="setRows"
      />
      <hr />
      <gdd-table
        :row_form="row_form"
        :transactions="transactions"
        @change-transactions="setTransactions"
      />
    </b-container>
  </div>
</template>
<script>
import GddStatus from '../KontoOverview/GddStatus.vue'
import GddSend from '../KontoOverview/GddSend.vue'
import GddTable from '../KontoOverview/GddTable.vue'

export default {
  name: 'Overview',
  data() {
    return {
      row_form: true,
      row_check: false,
      row_thx: false,
      transactions: [],
    }
  },
  components: {
    GddStatus,
    GddSend,
    GddTable,
  },
  created() {
    this.$store.dispatch('accountBalance', $cookies.get('gdd_session_id'))
  },
  methods: {
    setRows(rows) {
      this.row_form = rows.row_form
      this.row_check = rows.row_check
      this.row_thx = rows.row_thx
    },
    setTransactions(transactions) {
      this.transactions = transactions
    },
  },
}
</script>

<style>
.active {
  background-color: rgba(192, 192, 192, 0.568);
}
</style>
