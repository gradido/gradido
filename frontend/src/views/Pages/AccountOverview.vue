<template>
  <div>
    <b-container fluid>
      <b-row>
        <b-col class="col-6">
          <b-row>
            <b-col class="col-11 bg-gray text-white p-3">
              <gdd-status
                class="gdd-status-gdd"
                v-if="showContext"
                :pending="pending"
                :balance="balance"
                status-text="GDD"
              />
            </b-col>
          </b-row>
        </b-col>
        <b-col class="col-6 text-right">
          <b-row>
            <b-col class="bg-white text-gray p-3">
              <gdd-status
                class="gdd-status-gdt"
                v-if="showContext"
                :pending="pending"
                :balance="GdtBalance"
                status-text="GDT"
              />
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <br />

      <template #transaction-form>
        <transaction-form :balance="balance" @set-transaction="setTransaction"></transaction-form>
      </template>

      <gdd-transaction-list
        v-if="showContext"
        :transactions="transactions"
        :pageSize="5"
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        @update-transactions="updateTransactions"
      />
      <gdd-transaction-list-footer v-if="showContext" :count="transactionCount" />
    </b-container>
  </div>
</template>
<script>
import GddStatus from './GddGdtStatus.vue'
import GddTransactionList from './AccountOverview/GddTransactionList.vue'
import GddTransactionListFooter from './AccountOverview/GddTransactionListFooter.vue'

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
      this.currentTransactionStep = 1
    },

    onReset() {
      this.currentTransactionStep = 0
    },

    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
}
</script>
