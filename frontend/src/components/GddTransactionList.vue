<template>
  <div class="gdd-transaction-list">
    <div class="list-group">
      <div v-if="!transactions" class="test-no-transactionlist text-end">
        <variant-icon icon="exclamation-triangle" variant="danger" class="me-2" />
        <small>
          {{ $t('error.no-transactionlist') }}
        </small>
      </div>
      <div v-if="transactionCount < 0" class="test-empty-transactionlist text-end">
        <variant-icon icon="exclamation-triangle" variant="danger" class="me-2" />
        <small>{{ $t('error.empty-transactionlist') }}</small>
      </div>

      <div v-for="({ id, typeId }, index) in transactions" :key="`l1-` + id">
        <transaction-list-item
          v-if="typeId === 'DECAY'"
          :type-id="typeId"
          class="pointer bg-white app-box-shadow gradido-border-radius px-4 pt-2 test-list-group-item"
        >
          <template #DECAY>
            <transaction-decay v-bind="transactions[index]" />
          </template>
        </transaction-list-item>
      </div>
      <div class="mt-3">
        <div v-for="transaction in transactions" :key="`l2-` + transaction.id">
          <transaction-list-item
            v-if="transaction.typeId !== 'DECAY'"
            :type-id="transaction.typeId"
            class="pointer mb-3 bg-white app-box-shadow gradido-border-radius p-3 test-list-group-item"
          >
            <template v-if="transaction.typeId !== 'LINK_SUMMARY'" #item>
              <gdd-transaction :transaction="transaction" />
            </template>
            <template v-else #LINK_SUMMARY>
              <transaction-link-summary
                v-bind="transaction"
                :transaction-link-count="transactionLinkCount"
                @update-transactions="updateTransactions"
              />
            </template>
          </transaction-list-item>
        </div>
      </div>
    </div>
    <BPagination
      v-if="isPaginationVisible"
      :model-value="currentPage"
      class="mt-3"
      pills
      size="lg"
      :per-page="pageSize"
      :total-rows="transactionCount"
      align="center"
      :hide-ellipsis="true"
      @update:model-value="currentPage = $event"
    />
    <div v-if="transactionCount <= 0" class="mt-4 text-center">
      <IBiThreeDots v-if="pending" />
      <div v-else>{{ $t('transaction.nullTransactions') }}</div>
    </div>
  </div>
</template>

<script>
import TransactionListItem from '@/components/TransactionListItem'
import TransactionDecay from '@/components/Transactions/TransactionDecay'
import TransactionLinkSummary from '@/components/Transactions/TransactionLinkSummary'
import GddTransaction from '@/components/Transactions/GddTransaction.vue'

export default {
  name: 'GddTransactionList',
  components: {
    GddTransaction,
    TransactionListItem,
    TransactionDecay,
    TransactionLinkSummary,
  },
  props: {
    transactions: { type: Array, default: () => [] },
    pageSize: { type: Number, default: 25 },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
    pending: { type: Boolean },
  },
  data() {
    return {
      currentPage: 1,
    }
  },
  computed: {
    isPaginationVisible() {
      return this.showPagination && this.pageSize < this.transactionCount
    },
  },
  watch: {
    currentPage() {
      this.updateTransactions()
    },
    timestamp: {
      immediate: true,
      handler: 'updateTransactions',
    },
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions', {
        currentPage: this.currentPage,
        pageSize: this.pageSize,
      })
      window.scrollTo(0, 0)
    },
  },
}
</script>

<style>
.el-table .cell {
  padding-left: 0;
  padding-right: 0;
}
</style>
