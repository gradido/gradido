<template>
  <div>
    <b-container fluid>
      <b-row>
        <b-col class="bg-gray text-white text-center p-3">
          <gdd-status
            v-if="showContext"
            :pending="pending"
            :balance="balance"
            :gdt-balance="GdtBalance"
            :gdt="false"
          />
        </b-col>
      </b-row>

      <br />
      <gdd-send :currentTransactionStep="currentTransactionStep">
        <template #transaction-form>
          <transaction-form :balance="balance" @set-transaction="setTransaction"></transaction-form>
        </template>
        <template #transaction-confirmation>
          <transaction-confirmation
            :email="transactionData.email"
            :amount="transactionData.amount"
            :memo="transactionData.memo"
            :loading="loading"
            @send-transaction="sendTransaction"
            @on-reset="onReset"
          ></transaction-confirmation>
        </template>
        <template #transaction-result>
          <transaction-result
            :error="error"
            :errorResult="errorResult"
            @on-reset="onReset"
          ></transaction-result>
        </template>
      </gdd-send>
      <hr />
    </b-container>
  </div>
</template>
<script>
import GddStatus from './GddGdtStatus.vue'
import GddSend from './SendOverview/GddSend.vue'

import TransactionForm from './SendOverview/GddSend/TransactionForm.vue'
import TransactionConfirmation from './SendOverview/GddSend/TransactionConfirmation.vue'
import TransactionResult from './SendOverview/GddSend/TransactionResult.vue'
import { sendCoins } from '../../graphql/mutations.js'

const EMPTY_TRANSACTION_DATA = {
  email: '',
  amount: 0,
  memo: '',
}

export default {
  name: 'SendOverview',
  components: {
    GddStatus,
    GddSend,

    TransactionForm,
    TransactionConfirmation,
    TransactionResult,
  },
  data() {
    return {
      transactionData: { ...EMPTY_TRANSACTION_DATA },
      error: false,
      errorResult: '',
      currentTransactionStep: 0,
      loading: false,
    }
  },
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
    transactions: {
      default: () => [],
    },

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
    async sendTransaction() {
      this.loading = true
      this.$apollo
        .mutate({
          mutation: sendCoins,
          variables: this.transactionData,
        })
        .then(() => {
          this.error = false
          this.$emit('update-balance', this.transactionData.amount)
        })
        .catch((err) => {
          this.errorResult = err.message
          this.error = true
        })
      this.currentTransactionStep = 2
      this.loading = false
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
