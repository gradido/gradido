<template>
  <div class="transaction-link-list">
    <div v-if="items.length > 0">
      {{ $t('transactionlink.form_header') }}
      <b-table striped hover :fields="fields" :items="items"></b-table>
    </div>
    <b-pagination
      pills
      size="lg"
      v-model="currentPage"
      per-page="perPage"
      :total-rows="rows"
      align="center"
    ></b-pagination>
  </div>
</template>
<script>
import { listTransactionLinksAdmin } from '../graphql/listTransactionLinksAdmin.js'
export default {
  name: 'TransactionLinkList',
  props: {
    userId: { type: Number, required: true },
  },
  data() {
    return {
      fields: [
        {
          key: 'createdAt',
          label: this.$t('transactionlink.created'),
          formatter: (value, key, item) => {
            return this.$d(new Date(value))
          },
        },
        {
          key: 'amount',
          label: this.$t('transactionlist.amount'),
          formatter: (value, key, item) => {
            return `${value} GDD`
          },
        },
        { key: 'memo', label: this.$t('transactionlist.memo') },
        {
          key: 'validUntil',
          label: this.$t('transactionlink.expired'),
          formatter: (value, key, item) => {
            return this.$d(new Date(value))
          },
        },
      ],
      items: [],
      rows: 0,
      currentPage: 1,
      perPage: 5,
    }
  },
  methods: {
    getListTransactionLinks() {
      this.$apollo
        .query({
          query: listTransactionLinksAdmin,
          variables: {
            currentPage: this.currentPage,
            pageSize: this.perPage,
            userId: this.userId,
          },
        })
        .then((result) => {
          // this.rows = result.data.length
          this.items = result.data.listTransactionLinksAdmin
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
  },
  created() {
    this.getListTransactionLinks()
  },
  watch: {
    currentPage() {
      this.getListTransactionLinks()
    },
  },
}
</script>
