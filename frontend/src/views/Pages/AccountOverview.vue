<template>
  <div>
    <base-header class="pb-4 pt-2 bg-transparent"></base-header>
    <b-container fluid class="p-2">
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
import GddStatus from './AccountOverview/GddStatus.vue'
import GddSend from './AccountOverview/GddSend.vue'
import GddTable from './AccountOverview/GddTable.vue'

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
      default: () => [],
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
