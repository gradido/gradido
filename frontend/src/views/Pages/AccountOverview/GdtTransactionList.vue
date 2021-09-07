<template>
  <div class="gdt-transaction-list">
    <div class="list-group">
      <div v-if="transactionGdtCount === 0">
        {{ $t('gdt.no-transactions') }}
      </div>
      <div
        v-else
        v-for="{
          transactionId,
          amount,
          date,
          comment,
          gdtEntryType,
          factor,
          gdt,
        } in transactionsGdt"
        :key="transactionId"
      >
 
        <transaction
          :amount="amount"
          :date="date"
          :comment="comment"
          :gdtEntryType="gdtEntryType"
          :factor="factor"
          :gdt="gdt"
        ></transaction>
      </div>
    </div>
    <pagination-buttons
      v-if="transactionGdtCount > pageSize"
      :has-next="hasNext"
      :has-previous="hasPrevious"
      :total-pages="totalPages"
      :current-page="currentPage"
      @show-next="showNext"
      @show-previous="showPrevious"
    ></pagination-buttons>
  </div>
</template>

<script>
import { listGDTEntriesQuery } from '../../../graphql/queries'
import PaginationButtons from '../../../components/PaginationButtons'
import Transaction from '../../../components/Transaction.vue'

export default {
  name: 'gdt-transaction-list',
  components: {
    PaginationButtons,
    Transaction,
  },
  data() {
    return {
      transactionsGdt: { default: () => [] },
      transactionGdtCount: { type: Number, default: 0 },
      currentPage: 1,
      pageSize: 25,
    }
  },
  computed: {
    hasNext() {
      return this.currentPage * this.pageSize < this.transactionGdtCount
    },
    hasPrevious() {
      return this.currentPage > 1
    },
    totalPages() {
      return Math.ceil(this.transactionGdtCount / this.pageSize)
    },
  },
  methods: {
    async updateGdt() {
      this.$apollo
        .query({
          query: listGDTEntriesQuery,
          variables: {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          },
        })
        .then((result) => {
          const {
            data: { listGDTEntries },
          } = result
          this.transactionsGdt = listGDTEntries.gdtEntries
          this.transactionGdtCount = listGDTEntries.count
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    throwError(msg) {
      throw new Error(msg)
    },
    showNext() {
      this.currentPage++
      this.updateGdt()
      window.scrollTo(0, 0)
    },
    showPrevious() {
      this.currentPage--
      this.updateGdt()
      window.scrollTo(0, 0)
    },
  },
  mounted() {
    this.updateGdt()
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}

.nav-tabs .nav-link.active,
.nav-tabs .nav-item.show .nav-link {
  background-color: #f8f9fe38;
}
</style>
