<template>
  <div>
    <base-header class="pb-lg-4 pt-lg-2 bg-transparent"></base-header>
    <b-container fluid class="p-0 p-lg-2 mt-lg-5">
      <gdd-status
        v-if="showContext"
        :pending="pending"
        :balance="balance"
        :gdt-balance="GdtBalance"
      />
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
            :date="transactionData.target_date"
            :loading="loading"
            @send-transaction="sendTransaction"
            @on-reset="onReset"
          ></transaction-confirmation>
        </template>
        <template #transaction-result>
          <transaction-result :error="error" @on-reset="onReset"></transaction-result>
        </template>
      </gdd-send>
      <hr />
      <gdd-transaction-list
        v-if="showContext"
        :transactions="transactions"
        :max="5"
        :timestamp="timestamp"
        :transactionCount="transactionCount"
        @update-transactions="$emit('update-transactions')"
      />
      <gdd-transaction-list-footer v-if="showContext" :count="transactionCount" />
    </b-container>
  </div>
</template>
<script>
import GddStatus from './AccountOverview/GddStatus.vue'
import GddSend from './AccountOverview/GddSend.vue'
import GddTransactionList from './AccountOverview/GddTransactionList.vue'
import GddTransactionListFooter from './AccountOverview/GddTransactionListFooter.vue'
import TransactionForm from './AccountOverview/GddSend/TransactionForm.vue'
import TransactionConfirmation from './AccountOverview/GddSend/TransactionConfirmation.vue'
import TransactionResult from './AccountOverview/GddSend/TransactionResult.vue'
import communityAPI from '../../apis/communityAPI.js'

const EMPTY_TRANSACTION_DATA = {
  email: '',
  amount: 0,
  memo: '',
  target_date: '',
}

export default {
  name: 'Overview',
  components: {
    GddStatus,
    GddSend,
    GddTransactionList,
    GddTransactionListFooter,
    TransactionForm,
    TransactionConfirmation,
    TransactionResult,
  },
  data() {
    return {
      timestamp: Date.now(),
      transactionData: EMPTY_TRANSACTION_DATA,
      error: false,
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
      data.target_date = new Date(Date.now()).toISOString()
      this.transactionData = { ...data }
      this.currentTransactionStep = 1
    },
    async sendTransaction() {
      this.loading = true
      const result = await communityAPI.send(this.$store.state.sessionId, this.transactionData)
      if (result.success) {
        this.error = false
        this.$emit('update-balance', this.transactionData.amount)
      } else {
        this.error = true
      }
      this.currentTransactionStep = 2
      this.loading = false
    },
    onReset() {
      this.transactionData = EMPTY_TRANSACTION_DATA
      this.currentTransactionStep = 0
    },
  },
}
</script>

<style>
.active {
  background-color: rgba(192, 192, 192, 0.568);
}
</style>
