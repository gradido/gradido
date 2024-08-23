<template>
  <div class="gdt-transaction-list">
    <div class="list-group">
      <div v-if="transactionGdtCount === 0" class="text-center">
        {{ $t('gdt.no-transactions') }}
        <hr />
        <BButton class="gdt-funding" :href="link" target="_blank">
          {{ $t('gdt.funding') }}
        </BButton>
      </div>
      <div v-else-if="transactionGdtCount === -1" class="text-center">
        {{ $t('gdt.not-reachable') }}
      </div>
      <div
        v-for="{ id, amount, date, comment, gdtEntryType, factor, gdt } in transactionsGdt"
        v-else
        :key="id"
      >
        <transaction
          :id="id"
          :amount="amount"
          :date="date"
          :comment="comment"
          :gdt-entry-type="gdtEntryType"
          :factor="factor"
          :gdt="gdt"
        />
      </div>
    </div>
    <BPagination
      v-if="transactionGdtCount > pageSize"
      :model-value="currentPage"
      @update:model-value="currentPage = $event"
      class="mt-3"
      pills
      size="lg"
      :per-page="pageSize"
      :total-rows="transactionGdtCount"
      align="center"
      :hide-ellipsis="true"
    />
  </div>
</template>

<script>
import Transaction from '@/components/Transaction'

export default {
  name: 'GdtTransactionList',
  components: {
    Transaction,
  },
  props: {
    transactionsGdt: {
      type: Array,
      required: true,
    },
    transactionGdtCount: { type: Number, required: true },
    pageSize: { type: Number, required: true },
    modelValue: { type: Number, required: true },
  },
  data() {
    return {
      currentPage: this.value,
      link: 'https://gradido.net/' + this.$store.state.language + '/memberships/',
    }
  },
  watch: {
    currentPage() {
      if (this.modelValue !== this.currentPage) this.$emit('input', this.currentPage)
    },
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0;
  padding-right: 0;
}

.nav-tabs .nav-link.active,
.nav-tabs .nav-item.show .nav-link {
  background-color: #f8f9fe38;
}

.gdt-transaction-list-item {
  outline: none !important;
}
</style>
