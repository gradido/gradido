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
              <!-- Straight up to whoever owns this list: a tap on the counterparty's name
                   opens the contact window, and there is ONE of those per list rather than
                   one per row. -->
              <gdd-transaction
                :transaction="transaction"
                @open-member="$emit('open-member', $event)"
              />
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
    <!-- Exactly zero, not "nothing positive": -1 is the failed request above, and a
         sentence about bookings has no business under an error banner. -->
    <div v-if="transactionCount === 0" class="mt-4 text-center">
      <IBiThreeDots v-if="pending" />
      <!-- Two kinds of nothing. "You have no transactions yet" is false under a list
           narrowed to one member -- the member may have hundreds, only none with this
           person -- and told so they would go looking for their money. -->
      <div v-else-if="narrowed">{{ $t('transaction.noneWithMember') }}</div>
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
     * The page these rows ARE -- decided, fetched and held by Transactions.vue, which owns
     * the query behind them.
     *
     * ⛔ Not this component's own state. It was until 30.08.2026, and the two drifted apart
     * every time a page number survived a navigation that rebuilt this component. The way
     * to another page is `askForPage`: ask, and the number comes back down here with the
     * rows it belongs to.
     */
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: PAGE_SIZE },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
    openLinkCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
    pending: { type: Boolean },
    /** Whether these rows are the bookings shared with ONE member rather than the account. */
    narrowed: { type: Boolean, default: false },
  },
  // Declared, so that the handler does not also land on the root element as a plain
  // attribute -- and so that the two events this list raises are readable in one place.
  emits: ['update-transactions', 'open-member'],
  computed: {
    isPaginationVisible() {
      return this.showPagination && this.pageSize < this.transactionCount
    },
  },
  watch: {
    // ⚠️ Dead wiring as it stands, and worth knowing before anyone traces it again: nothing
    // ever changes `timestamp`. Transactions.vue sets it once per mount and never writes to
    // it, and it is the only place this component is used -- so this handler cannot fire in
    // production. Left alone because removing a prop is not this change's business.
    //
    // ⚠️ Wrapped rather than `handler: 'askForPage'`: a watcher hands its handler the new
    // value, and the new value here would be the timestamp, going out as a page number.
    timestamp: {
      immediate: false,
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
