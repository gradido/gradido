<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="order-xl-1">
          <gdd-transaction-list
            :timestamp="timestamp"
            :transactionCount="transactionCount"
            :transactions="transactions"
            :show-pagination="true"
            @update-transactions="updateTransactions"
          />
          <gdd-transaction-gdt-list
            :timestamp="timestamp"
            :transactionsGdt="transactionsGdt"
            @update-gdt="updateGdt"
          />
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import GddTransactionList from './AccountOverview/GddTransactionList.vue'
import GddTransactionGdtList from './AccountOverview/GddTransactionGdtList.vue'

export default {
  name: 'UserProfileTransactionList',
  components: {
    GddTransactionList,
    GddTransactionGdtList,
  },
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionsGdt: {
      default: () => [],
    },
  },
  data() {
    return {
      timestamp: Date.now(),
    }
  },
  methods: {
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
    updateGdt() {
      this.$emit('update-gdt')
    },
  },
}
</script>
<style></style>
