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

      <div v-for="({ id, typeId }, index) in transactions" :key="`l1-` + id">
        <transaction-list-item
          v-if="typeId === 'DECAY'"
          :typeId="typeId"
          class="pointer bg-white appBoxShadow gradido-border-radius px-4 pt-2 test-list-group-item"
        >
          <template #DECAY>
            <transaction-decay v-bind="transactions[index]" />
          </template>
        </transaction-list-item>
      </div>
      <div class="mt-3">
        <div v-for="({ id, typeId }, index) in transactions" :key="`l2-` + id">
          <transaction-list-item
            v-if="typeId !== 'DECAY'"
            :typeId="typeId"
            class="pointer mb-3 bg-white appBoxShadow gradido-border-radius p-3 test-list-group-item"
          >
            <template #SEND>
              <transaction-send v-bind="transactions[index]" />
            </template>

            <template #RECEIVE>
              <transaction-receive v-bind="transactions[index]" />
            </template>

            <template #CREATION>
              <transaction-creation v-bind="transactions[index]" />
            </template>

            <template #LINK_SUMMARY>
              <transaction-link-summary
                v-bind="transactions[index]"
                :transactionLinkCount="transactionLinkCount"
                @update-transactions="updateTransactions"
              />
            </template>
          </transaction-list-item>
        </div>
      </div>
    </div>
    <b-pagination
      v-if="isPaginationVisible"
      class="mt-3"
      pills
      size="lg"
      v-model="currentPage"
      :per-page="pageSize"
      :total-rows="transactionCount"
      align="center"
      :hide-ellipsis="true"
    ></b-pagination>

    <div v-if="transactionCount <= 0" class="mt-4 text-center">
      <b-icon v-if="pending" icon="three-dots" animation="cylon"></b-icon>
      <div v-else>{{ $t('transaction.nullTransactions') }}</div>
    </div>
  </div>
</template>

<script>
import TransactionListItem from '@/components/TransactionListItem'
import TransactionDecay from '@/components/Transactions/TransactionDecay'
import TransactionSend from '@/components/Transactions/TransactionSend'
import TransactionReceive from '@/components/Transactions/TransactionReceive'
import TransactionCreation from '@/components/Transactions/TransactionCreation'
import TransactionLinkSummary from '@/components/Transactions/TransactionLinkSummary'

export default {
  name: 'gdd-transaction-list',
  components: {
    TransactionListItem,
    TransactionDecay,
    TransactionSend,
    TransactionReceive,
    TransactionCreation,
    TransactionLinkSummary,
  },
  props: {
    transactions: { default: () => [] },
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
  methods: {
    updateTransactions() {
      this.$emit('update-transactions', {
        currentPage: this.currentPage,
        pageSize: this.pageSize,
      })
      window.scrollTo(0, 0)
    },
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
