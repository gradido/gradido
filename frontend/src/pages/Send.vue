<template>
  <div>
    <b-container>
      <gdd-send :currentTransactionStep="currentTransactionStep" class="pt-3 ml-2 mr-2">
        <template #transactionForm>
          <transaction-form
            v-bind="transactionData"
            :balance="balance"
            @set-transaction="setTransaction"
          ></transaction-form>
        </template>
        <template #transactionConfirmationSend>
          <transaction-confirmation-send
            :balance="balance"
            :email="transactionData.email"
            :amount="transactionData.amount"
            :memo="transactionData.memo"
            @send-transaction="sendTransaction"
            @on-reset="onReset"
          ></transaction-confirmation-send>
        </template>
        <template #transactionConfirmationLink>
          <transaction-confirmation-link
            :balance="balance"
            :email="transactionData.email"
            :amount="transactionData.amount"
            :memo="transactionData.memo"
            :loading="loading"
            @send-transaction="sendTransaction"
            @on-reset="onReset"
          ></transaction-confirmation-link>
        </template>
        <template #transactionResultSendSuccess>
          <transaction-result-send-success @on-reset="onReset"></transaction-result-send-success>
        </template>
        <template #transactionResultSendError>
          <transaction-result-send-error
            :error="error"
            :errorResult="errorResult"
            @on-reset="onReset"
          ></transaction-result-send-error>
        </template>
        <template #transactionResultLink>
          <transaction-result-link
            :link="link"
            :amount="amount"
            :memo="memo"
            :validUntil="validUntil"
            @on-reset="onReset"
          ></transaction-result-link>
        </template>
      </gdd-send>
    </b-container>
  </div>
</template>
<script>
import GddSend, { TRANSACTION_STEPS } from '@/components/GddSend.vue'
import TransactionForm from '@/components/GddSend/TransactionForm.vue'
import TransactionConfirmationSend from '@/components/GddSend/TransactionConfirmationSend.vue'
import TransactionConfirmationLink from '@/components/GddSend/TransactionConfirmationLink.vue'
import TransactionResultSendSuccess from '@/components/GddSend/TransactionResultSendSuccess.vue'
import TransactionResultSendError from '@/components/GddSend/TransactionResultSendError.vue'
import TransactionResultLink from '@/components/GddSend/TransactionResultLink.vue'
import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'

const EMPTY_TRANSACTION_DATA = {
  email: '',
  amount: 0,
  memo: '',
}

export const SEND_TYPES = {
  send: 'send',
  link: 'link',
}

export default {
  name: 'Send',
  components: {
    GddSend,
    TransactionForm,
    TransactionConfirmationSend,
    TransactionConfirmationLink,
    TransactionResultSendSuccess,
    TransactionResultSendError,
    TransactionResultLink,
  },
  data() {
    return {
      transactionData: { ...EMPTY_TRANSACTION_DATA },
      error: false,
      errorResult: '',
      currentTransactionStep: TRANSACTION_STEPS.transactionForm,
      loading: false,
      link: null,
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
      switch (data.selected) {
        case SEND_TYPES.send:
          this.currentTransactionStep = TRANSACTION_STEPS.transactionConfirmationSend
          break
        case SEND_TYPES.link:
          this.currentTransactionStep = TRANSACTION_STEPS.transactionConfirmationLink
          break
      }
    },
    async sendTransaction() {
      this.loading = true
      this.error = false
      switch (this.transactionData.selected) {
        case SEND_TYPES.send:
          this.$apollo
            .mutate({
              mutation: sendCoins,
              variables: this.transactionData,
            })
            .then(() => {
              this.error = false
              this.$emit('set-tunneled-email', null)
              this.updateTransactions({})
              this.transactionData = { ...EMPTY_TRANSACTION_DATA }
              this.currentTransactionStep = TRANSACTION_STEPS.transactionResultSendSuccess
            })
            .catch((error) => {
              this.errorResult = error.message
              this.error = true
              this.currentTransactionStep = TRANSACTION_STEPS.transactionResultSendError
            })
          break
        case SEND_TYPES.link:
          this.$apollo
            .mutate({
              mutation: createTransactionLink,
              variables: { amount: this.transactionData.amount, memo: this.transactionData.memo },
            })
            .then((result) => {
              this.$emit('set-tunneled-email', null)
              const {
                data: {
                  createTransactionLink: { link, amount, memo, validUntil },
                },
              } = result
              this.link = link
              this.amount = amount
              this.memo = memo
              this.validUntil = validUntil
              this.transactionData = { ...EMPTY_TRANSACTION_DATA }
              this.currentTransactionStep = TRANSACTION_STEPS.transactionResultLink
              this.updateTransactions({})
            })
            .catch((error) => {
              this.toastError(error.message)
            })
          break
        default:
          throw new Error(`undefined transactionData.selected : ${this.transactionData.selected}`)
      }
      this.loading = false
    },
    onReset() {
      this.currentTransactionStep = TRANSACTION_STEPS.transactionForm
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.updateTransactions({})
  },
}
</script>
