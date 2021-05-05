<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-transparent"></base-header>
    <b-container fluid class="mt--7">
      <gdd-status v-if="showTransactionList" :balance="balance" :gdt-balance="GdtBalance" />
      <br />
      <gdd-send
        :balance="balance"
        :show-transaction-list="showTransactionList"
        @update-balance="updateBalance"
        @toggle-show-list="toggleShowList"
      />
      <hr />
      <gdd-table
        v-if="showTransactionList"
        :transactions="transactions"
        @update-transactions="updateTransactions"
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
      showTransactionList: true,
    }
  },
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },

    transactions: {
      default: [],
    },
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
    updateTransactions() {
      this.$emit('update-transactions')
    },
  },
}
</script>

<style>
.active {
  background-color: rgba(192, 192, 192, 0.568);
}
</style>
