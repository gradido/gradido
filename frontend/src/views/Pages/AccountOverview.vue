<template>
  <div>
    <div class="container-fluid">
      <b-row class="ml-1 mr-1 mb-2">
        <b-col class="col-6 p-3 g-border">
          <status class="gdd-status-gdd" :pending="pending" :balance="balance" status-text="GDD" />
        </b-col>
        <b-col class="col-6 p-3 text-right g-border">
          <status
            class="gdd-status-gdt"
            :pending="pending"
            :balance="GdtBalance"
            status-text="GDT"
          />
        </b-col>
      </b-row>
      <gdd-transaction-list
        :gddbalance="balance"
        :transactions="transactions"
        :pageSize="5"
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        @update-transactions="updateTransactions"
      />
      <gdd-transaction-list-footer :count="transactionCount" />
    </div>
  </div>
</template>
<script>
import Status from '../../components/Status.vue'
import GddTransactionList from './AccountOverview/GddTransactionList.vue'
import GddTransactionListFooter from './AccountOverview/GddTransactionListFooter.vue'

export default {
  name: 'Overview',
  components: {
    Status,
    GddTransactionList,
    GddTransactionListFooter,
  },
  data() {
    return {
      timestamp: Date.now(),
    }
  },
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    pending: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
}
</script>
<style>
.g-border {
  border: #ffffff 2px;
  border-style: inset;
  border-radius: 5px;
}
</style>
