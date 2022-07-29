<template>
  <div class="gdt-transaction-list">
    <div class="list-group">
      <div v-if="transactionGdtCount === 0" class="text-center">
        {{ $t('gdt.no-transactions') }}
        <hr />
        <b-button class="gdt-funding" :href="link" target="_blank">
          {{ $t('gdt.funding') }}
        </b-button>
      </div>
      <div v-else-if="transactionGdtCount === -1" class="text-center">
        {{ $t('gdt.not-reachable') }}
      </div>
      <div
        v-else
        v-for="{ id, amount, date, comment, gdtEntryType, factor, gdt } in transactionsGdt"
        :key="id"
      >
        <transaction
          :amount="amount"
          :date="date"
          :comment="comment"
          :gdtEntryType="gdtEntryType"
          :factor="factor"
          :gdt="gdt"
          :id="id"
        ></transaction>
      </div>
    </div>
    <b-pagination
      v-if="transactionGdtCount > pageSize"
      class="mt-3"
      pills
      size="lg"
      v-model="currentPage"
      :per-page="pageSize"
      :total-rows="transactionGdtCount"
      align="center"
    >
      <template #ellipsis-text><slot></slot></template>
    </b-pagination>
  </div>
</template>

<script>
import Transaction from '@/components/Transaction.vue'

export default {
  name: 'gdt-transaction-list',
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
    value: { type: Number, required: true },
  },
  data() {
    return {
      currentPage: this.value,
      link: 'https://gradido.net/' + this.$store.state.language + '/memberships/',
    }
  },
  watch: {
    currentPage() {
      if (this.value !== this.currentPage) this.$emit('input', this.currentPage)
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

.gdt-transaction-list-item {
  outline: none !important;
}
</style>
