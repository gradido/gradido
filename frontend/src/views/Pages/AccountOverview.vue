<template>
  <div>
    <b-container fluid>
      <gdd-status
        v-if="showContext"
        :pending="pending"
        :balance="balance"
        :gdt-balance="GdtBalance"
      />
      <br />
      <hr>
      GDD Statistik
      

      <hr>
      GDT Statistik
     
   
 

      <template #transaction-form>
        <transaction-form :balance="balance" @set-transaction="setTransaction"></transaction-form>
      </template>

 
      <hr />
      <gdd-transaction-list
        v-if="showContext"
        :transactions="transactions"
        :pageSize="5"
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        @update-transactions="updateTransactions"
      />
      <gdd-transaction-list-footer v-if="showContext" :count="transactionCount" />
    <hr>
      UserAccount Statistik
   
    </b-container>
  </div>
</template>
<script>

import GddStatus from './AccountOverview/GddStatus.vue'
 
import GddTransactionList from './AccountOverview/GddTransactionList.vue'
import GddTransactionListFooter from './AccountOverview/GddTransactionListFooter.vue'

const EMPTY_TRANSACTION_DATA = {
  email: '',
  amount: 0,
  memo: '',
}

export default {
  name: 'Overview',
  components: {
    GddStatus,
   
    GddTransactionList,
    GddTransactionListFooter,
  },
  data() {
    return {
      timestamp: Date.now(),
      transactionData: { ...EMPTY_TRANSACTION_DATA },
      error: false,
      errorResult: '',
      currentTransactionStep: 0,
      loading: false,
      datacollectionGdd: null,
      datacollectionGdt: null,
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
  computed: {
    showContext() {
      return this.currentTransactionStep === 0
    },
  },
  methods: {
    setTransaction(data) {
      this.transactionData = { ...data }
      this.currentTransactionStep = 1
    },

    onReset() {
      this.transactionData = { ...EMPTY_TRANSACTION_DATA }
      this.currentTransactionStep = 0
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
 
  },
  
}
</script>
