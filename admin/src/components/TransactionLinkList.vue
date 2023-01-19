<template>
  <div class="transaction-link-list">
    <div v-if="items.length > 0">
      <div class="h3">{{ $t('transactionlink.name') }}</div>
      <b-table striped hover :fields="fields" :items="items"></b-table>
    </div>
    <b-pagination
      pills
      size="lg"
      v-model="currentPage"
      :per-page="perPage"
      :total-rows="rows"
      align="center"
      :hide-ellipsis="true"
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
          this.rows = result.data.listTransactionLinksAdmin.linkCount
          this.items = result.data.listTransactionLinksAdmin.linkList
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
  },
  computed: {
    fields() {
      return [
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
        { key: 'memo', label: this.$t('transactionlist.memo'), class: 'text-break' },
        {
          key: 'validUntil',
          label: this.$t('transactionlink.valid_until'),
          formatter: (value, key, item) => {
            return this.$d(new Date(value))
          },
        },
        {
          key: 'status',
          label: 'status',
          formatter: (value, key, item) => {
            // deleted
            if (item.deletedAt) return this.$t('deleted') + ': ' + this.$d(new Date(item.deletedAt))
            // redeemed
            if (item.redeemedAt)
              return this.$t('redeemed') + ': ' + this.$d(new Date(item.redeemedAt))
            // expired
            if (new Date() > new Date(item.validUntil))
              return this.$t('expired') + ': ' + this.$d(new Date(item.validUntil))
            // open
            return this.$t('open')
          },
        },
      ]
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
