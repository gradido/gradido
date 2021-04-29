<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-transparent"></base-header>
    <b-container fluid class="mt--7">
      <gdd-status
        :balance="balance"
        :gdt-balance="GdtBalance"
        :show-transaction-list="showTransactionList"
      />
      <br />
      <gdd-send
        :balance="balance"
        :show-transaction-list="showTransactionList"
        @update-balance="updateBalance"
        @toggle-show-list="toggleShowList"
      />
      <hr />
      <gdd-table
        :show-transaction-list="showTransactionList"
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
      transactions: [],
      showTransactionList: true,
    }
  },
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
  },
  components: {
    GddStatus,
    GddSend,
    GddTable,
  },
  methods: {
    toggleShowList(bool) {
      this.showTransactionList = bool
    },
    updateBalance(data) {
      this.$emit('update-balance', data.ammount)
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
