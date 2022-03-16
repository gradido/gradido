<template>
  <div class="gdd-transaction-list">
    <div class="list-group">
      <div v-if="!transactions" class="test-no-transactionlist text-right">
        <b-icon icon="exclamation-triangle" class="mr-2" variant="danger"></b-icon>
        <small>
          {{ $t('error.no-transactionlist') }}
        </small>
      </div>
      <div v-if="transactionCount < 0" class="test-empty-transactionlist text-right">
        <b-icon icon="exclamation-triangle" class="mr-2" variant="danger"></b-icon>
        <small>{{ $t('error.empty-transactionlist') }}</small>
      </div>

      <div v-for="({ id, typeId }, index) in transactions" :key="id">
        <transaction-list-item :typeId="typeId" class="pointer">
          <template #DECAY>
            <transaction-decay class="list-group-item" v-bind="transactions[index]" />
          </template>

          <template #SEND>
            <transaction-send
              class="list-group-item"
              v-bind="transactions[index]"
              :decayStartBlock="decayStartBlock"
            />
          </template>

          <template #RECEIVE>
            <transaction-receive
              class="list-group-item"
              v-bind="transactions[index]"
              :decayStartBlock="decayStartBlock"
            />
          </template>

          <template #CREATION>
            <transaction-creation
              class="list-group-item"
              v-bind="transactions[index]"
              :decayStartBlock="decayStartBlock"
            />
          </template>

          <template #TRANSACTION_LINK>
            <transaction-link
              class="list-group-item"
              v-bind="transactions[index]"
              :transactionLinkCount="transactionLinkCount"
            />
          </template>
        </transaction-list-item>
      </div>
    </div>
    <pagination-buttons
      v-if="showPagination"
      v-model="currentPage"
      :per-page="pageSize"
      :total-rows="transactionCount"
    ></pagination-buttons>
    <div v-if="transactionCount <= 0" class="mt-4 text-center">
      <span>{{ $t('transaction.nullTransactions') }}</span>
    </div>
  </div>
</template>

<script>
import TransactionListItem from '@/components/TransactionListItem'
import PaginationButtons from '@/components/PaginationButtons'
import TransactionDecay from '@/components/Transactions/TransactionDecay'
import TransactionSend from '@/components/Transactions/TransactionSend'
import TransactionReceive from '@/components/Transactions/TransactionReceive'
import TransactionCreation from '@/components/Transactions/TransactionCreation'
import TransactionLink from '@/components/Transactions/TransactionLink'

export default {
  name: 'gdd-transaction-list',
  components: {
    TransactionListItem,
    PaginationButtons,
    TransactionDecay,
    TransactionSend,
    TransactionReceive,
    TransactionCreation,
    TransactionLink,
  },
  data() {
    return {
      currentPage: 1,
    }
  },
  props: {
    decayStartBlock: { type: Date },
    transactions: { default: () => [] },
    pageSize: { type: Number, default: 25 },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
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
  watch: {
    currentPage() {
      this.updateTransactions()
    },
    timestamp: {
      immediate: true,
      handler: 'updateTransactions',
    },
  },
}
</script>
<style>
collaps-icon {
  width: 95%;
  position: absolute;
}
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
