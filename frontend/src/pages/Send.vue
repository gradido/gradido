<template>
  <div>
    <b-container>
      <gdd-send :currentTransactionStep="currentTransactionStep" class="pt-3 ml-2 mr-2">
        <template #transaction-form>
          <transaction-form :balance="balance" @set-transaction="setTransaction"></transaction-form>
        </template>
        <template #transaction-confirmation>
          <transaction-confirmation
            :balance="balance"
            :transactions="transactions"
            :selected="transactionData.selected"
            :email="transactionData.email"
            :amount="transactionData.amount"
            :memo="transactionData.memo"
            :loading="loading"
            @send-transaction="sendTransaction"
            @send-transaction-per-link="sendTransactionPerLink"
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
import GddSend from '@/components/GddSend.vue'
import TransactionForm from '@/components/GddSend/TransactionForm.vue'
import TransactionConfirmation from '@/components/GddSend/TransactionConfirmation.vue'
import TransactionResult from '@/components/GddSend/TransactionResult.vue'
import { sendCoins, sendCoinsPerLink } from '@/graphql/mutations.js'

const EMPTY_TRANSACTION_DATA = {
  email: '',
  amount: 0,
  memo: '',
}

export default {
  name: 'Send',
  components: {
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
  methods: {
    setTransaction(data) {
      this.transactionData = { ...data }
      this.currentTransactionStep = 1
    },
    async sendTransaction() {
      this.loading = true
      this.error = false
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
    async sendTransactionPerLink() {
      alert('sendTransactionPerLink: TODO : lege sendCoinsPerLink als mutation an!')
      this.loading = true
      this.error = false
      this.$apollo
        .mutate({
          mutation: sendCoinsPerLink,
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
      this.currentTransactionStep = 0
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.updateTransactions(0)
  },
}
</script>
