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
              <!-- Withdrawing a link changes the list, so it asks for the page it is on to
                   be fetched again. Named explicitly rather than handed the child's event:
                   the child sends no page, and a later one that did would silently become
                   the page number. -->
              <transaction-link-summary
                v-bind="transaction"
                :transaction-link-count="transactionLinkCount"
                :open-link-count="openLinkCount"
                @update-transactions="askForPage(currentPage)"
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
      @update:model-value="askForPage($event)"
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
import { PAGE_SIZE } from '@/constants'

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
    /**
     * The page these rows ARE -- decided, fetched and held by the layout.
     *
     * ⛔ Not this component's own state any more. It used to be, and the two numbers drifted
     * the moment the layout kept a page across a navigation: this component is destroyed and
     * rebuilt on every route change, so it came back at one, while the query above it still
     * held three. The paginator then highlighted one, the rows were three, and the buttons
     * back to one were disabled -- because as far as the paginator knew, it was there
     * already. (Bernd, 30.08.2026.)
     *
     * The way to another page is `askForPage`: ask, and the new number arrives back down
     * here with the rows it belongs to.
     */
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: PAGE_SIZE },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
    openLinkCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
    pending: { type: Boolean },
  },
  computed: {
    isPaginationVisible() {
      return this.showPagination && this.pageSize < this.transactionCount
    },
  },
  watch: {
    timestamp: {
      immediate: false,
      // ⚠️ Wrapped rather than `handler: 'askForPage'`: a watcher hands its handler the new
      // value, and the new value here is a timestamp. It would have gone out as the page
      // number.
      handler() {
        this.askForPage(this.currentPage)
      },
    },
  },
  methods: {
    askForPage(currentPage) {
      this.$emit('update-transactions', {
        currentPage,
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
