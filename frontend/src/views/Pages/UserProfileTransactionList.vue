<template>
  <div class="pb-4">
    <b-tabs content-class="mt-3 pt-4 pb-4" justified>
      <b-tab :title="'Gradido  (' + $n(balance, 'decimal') + ' GDD)'" class="px-4">
        <p class="tab-tex">{{ $t('transaction.gdd-text') }}</p>

        <gdd-transaction-list
          :timestamp="timestamp"
          :transactionCount="transactionCount"
          :transactions="transactions"
          :show-pagination="true"
          @update-transactions="updateTransactions"
        />
      </b-tab>

      <b-tab :title="'Gradido Transform  (' + $n(GdtBalance, 'decimal') + ' GDT)'" class="px-4">
        <p class="">{{ $t('transaction.gdt-text') }}</p>

        <gdt-transaction-list />
      </b-tab>
    </b-tabs>
  </div>
</template>
<script>
import GddTransactionList from './AccountOverview/GddTransactionList.vue'
import GdtTransactionList from './AccountOverview/GdtTransactionList.vue'

export default {
  name: 'UserProfileTransactionList',
  components: {
    GddTransactionList,
    GdtTransactionList,
  },
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
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
  },
}
</script>
<style></style>
