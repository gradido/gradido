<template>
  <div>
    <b-container fluid>
      <b-row>
        <b-col class="order-xl-1">
          <gdd-transaction-list
            :timestamp="timestamp"
            :transactionCount="transactionCount"
            :transactions="transactions"
            @update-transactions="updateTransactions"
          />
        </b-col>
      </b-row>
    </b-container>
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
