<template>
  <div>
    <base-header class="pb-lg-4 pt-lg-2 bg-transparent"></base-header>
    <b-container fluid class="p-lg-2">
      <gdd-status v-if="showContext" :balance="balance" :gdt-balance="GdtBalance" />
      <br />
      <gdd-send :currentTransactionStep="transactionSteps[currentTransactionStep]">
        <template #transaction-form>
          <transaction-form :balance="balance" @set-transaction="setTransaction"></transaction-form>
        </template>
        <template #transaction-confirmation>
          <transaction-confirmation
            :email="transactionData.email"
            :amount="transactionData.amount"
            :memo="transactionData.memo"
            :date="transactionData.target_date"
            @send-transaction="sendTransaction"
            @on-reset="onReset"
          ></transaction-confirmation>
        </template>
        <template #transaction-result>
          <transaction-result :error="error" @on-reset="onReset"></transaction-result>
        </template>
      </gdd-send>
      <hr />
      <gdd-table
        v-if="showContext"
        :transactions="transactions"
        :max="5"
        :timestamp="timestamp"
        :transactionCount="transactionCount"
        @update-transactions="$emit('update-transactions')"
      />
      <gdd-table-footer v-if="showContext" :count="transactionCount" />
    </b-container>
  </div>
</template>
<script>
import GddStatus from './AccountOverview/GddStatus.vue'
import GddSend from './AccountOverview/GddSend.vue'
import GddTable from './AccountOverview/GddTable.vue'
import GddTableFooter from './AccountOverview/GddTableFooter.vue'
import TransactionForm from './AccountOverview/GddSend/TransactionForm.vue'
import TransactionConfirmation from './AccountOverview/GddSend/TransactionConfirmation.vue'
import TransactionResult from './AccountOverview/GddSend/TransactionResult.vue'
import communityAPI from '../../apis/communityAPI.js'

export default {
  name: 'Overview',
  components: {
    GddStatus,
    GddSend,
    GddTable,
    GddTableFooter,
    TransactionForm,
    TransactionConfirmation,
    TransactionResult,
  },
  data() {
    return {
      showContext: true,
      timestamp: Date.now(),
      transactionData: {
        email: '',
        amount: 0,
        target_date: '',
        memo: '',
      },
      error: false,
      transactionSteps: ['transaction-form', 'transaction-confirmation', 'transaction-result'],
      currentTransactionStep: 0,
    }
  },
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
  },
  methods: {
    setTransaction(data) {
      this.transactionData.email = data.email
      this.transactionData.amount = data.amount
      this.transactionData.memo = data.memo
      this.transactionData.target_date = new Date(Date.now()).toISOString()
      this.showContext = false
      this.currentTransactionStep = 1
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
        this.error = false
        this.$emit('update-balance', this.transactionData.amount)
      } else {
        this.error = true
      }
      this.currentTransactionStep = 2
    },
    onReset() {
      this.transactionData.email = ''
      this.transactionData.amount = 0
      this.transactionData.memo = ''
      this.transactionData.target_date = ''
      this.showContext = true
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
