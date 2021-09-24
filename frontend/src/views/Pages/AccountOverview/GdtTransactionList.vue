<template>
  <div class="gdt-transaction-list">
    <div class="list-group" style="background-color: #fff">
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
      v-model="currentPage"
      :per-page="pageSize"
      :total-rows="transactionGdtCount"
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
      transactionsGdt: [],
      transactionGdtCount: { type: Number, default: 0 },
      currentPage: 1,
      pageSize: 25,
    }
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
          window.scrollTo(0, 0)
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
  mounted() {
    this.updateGdt()
  },
  watch: {
    currentPage() {
      this.updateGdt()
    },
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
