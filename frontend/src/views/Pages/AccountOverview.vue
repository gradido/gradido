<template>
  <div>
    <b-container fluid>
      <b-row>
        <b-col class="col-6">
          <b-row>
            <b-col class="col-11 bg-gray text-white p-3">
              <status
                class="gdd-status-gdd"
                :pending="pending"
                :balance="balance"
                status-text="GDD"
              />
            </b-col>
          </b-row>
        </b-col>
        <b-col class="col-6 text-right">
          <b-row>
            <b-col class="bg-white text-gray p-3">
              <status
                class="gdd-status-gdt"
                :pending="pending"
                :balance="GdtBalance"
                status-text="GDT"
              />
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <br />
      <gdd-transaction-list
        :transactions="transactions"
        :pageSize="5"
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        @update-transactions="updateTransactions"
      />
      <gdd-transaction-list-footer :count="transactionCount" />
    </b-container>
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
