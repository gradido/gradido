<template>
  <div class="gdd-send">
    <transaction-form
      v-if="showTransactionList"
      :balance="balance"
      @set-transaction="setTransaction"
    ></transaction-form>
    <transaction-confirmation
      v-if="row_check"
      :email="transactionData.email"
      :amount="transactionData.amount"
      :memo="transactionData.memo"
      :date="transactionData.target_date"
      @send-transaction="sendTransaction"
      @on-reset="onReset"
    ></transaction-confirmation>
    <transaction-result
      v-if="row_thx || row_error"
      :error="error"
      @on-reset="onReset"
    ></transaction-result>
  </div>
</template>
<script>
import TransactionForm from './GddSend/TransactionForm.vue'
import TransactionConfirmation from './GddSend/TransactionConfirmation.vue'
import TransactionResult from './GddSend/TransactionResult.vue'
import communityAPI from '../../../apis/communityAPI.js'

export default {
  name: 'GddSend',
  components: {
    TransactionForm,
    TransactionConfirmation,
    TransactionResult,
  },
  props: {
    balance: { type: Number, default: 0 },
    showTransactionList: { type: Boolean, default: true },
  },
  data() {
    return {
      transactionData: {
        email: '',
        amount: 0,
        target_date: '',
        memo: '',
      },
      error: false,
      row_check: false,
      row_thx: false,
      row_error: false,
    }
  },
  methods: {
    async onSubmit() {
      this.$emit('toggle-show-list', false)
      this.row_check = true
      this.row_thx = false
      this.row_error = false
    },
    async sendTransaction() {
      const result = await communityAPI.send(
        this.$store.state.sessionId,
        this.transactionData.email,
        this.transactionData.amount,
        this.transactionData.memo,
        this.transactionData.target_date,
      )
      if (result.success) {
        this.$emit('toggle-show-list', false)
        this.row_check = false
        this.row_thx = true
        this.row_error = false
        this.error = false
        this.$emit('update-balance', { ammount: this.transactionData.amount })
      } else {
        this.$emit('toggle-show-list', true)
        this.row_check = false
        this.row_thx = false
        this.row_error = true
        this.error = true
      }
    },
    onReset() {
      this.$emit('toggle-show-list', true)
      this.row_check = false
      this.row_thx = false
      this.row_error = false
    },
    setTransaction(data) {
      this.transactionData.email = data.email
      this.transactionData.amount = data.amount
      this.transactionData.memo = data.memo
      this.transactionData.target_date = new Date(Date.now()).toISOString()
      this.onSubmit()
    },
  },
}
</script>
