<template>
  <div>
    <div
      class="header pb-sm-1 pb-md-7 d-flex align-items-center profile-header"
      style="max-height: 200px"
    ></div>

    <gdd-transaction-list
      :timestamp="timestamp"
      :transactionCount="transactionCount"
      :transactions="transactions"
      @update-transactions="updateTransactions"
    />
  </div>
</template>
<script>
import GddTransactionList from './AccountOverview/GddTransactionList.vue'

export default {
  components: {
    GddTransactionList,
  },
  props: {
    transactions: {
      default: [],
    },
    transactionCount: { type: Number, default: 0 },
  },
  data() {
    return {
      timestamp: Date.now(),
    }
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions')
    },
  },
}
</script>
<style></style>
