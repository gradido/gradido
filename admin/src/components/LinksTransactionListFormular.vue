<template>
  <div class="links-transaction-list-formular">
    {{ $t('transactionlink.form_header') }}
    <b-table striped hover :fields="fields" :items="items"></b-table>
  </div>
</template>
<script>
import { listTransactionLinks } from '../graphql/listTransactionLinks.js'
export default {
  name: 'LinksTransactionListFormular',
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
    }
  },
  methods: {
    getListTransactionLinks() {
      alert('es wird nur die id von peter erkannt. bitte die links der userId aus dem backend geben.')
      this.$apollo
        .query({
          query: listTransactionLinks,
          variables: {
            currentPage: 1,
            pageSize: 5,
            userId: parseInt(this.userId),
          },
        })
        .then((result) => {
          console.log(result.data.listTransactionLinks)
          this.items = result.data.listTransactionLinks
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
  },
  created() {
    this.getListTransactionLinks()
  },
}
</script>
