<template>
  <div class="component-creation-transaction-list">
    {{ $t('transactionlist.title') }}
    <b-table striped hover :fields="fields" :items="items"></b-table>
  </div>
</template>
<script>
import { creationTransactionList } from '../graphql/creationTransactionList'
export default {
  name: 'CreationTransactionList',
  props: {
    userId: { type: Number, required: true },
  },
  data() {
    return {
      fields: [
        {
          key: 'creationDate',
          label: this.$t('transactionlist.date'),
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
        {
          key: 'linkedUser',
          label: this.$t('transactionlist.community'),
          formatter: (value, key, item) => {
            return `${value.firstName} ${value.lastName}`
          },
        },
        { key: 'memo', label: this.$t('transactionlist.memo') },
        {
          key: 'balanceDate',
          label: this.$t('transactionlist.balanceDate'),
          formatter: (value, key, item) => {
            return this.$d(new Date(value))
          },
        },
      ],
      items: [],
    }
  },
  methods: {
    getTransactions() {
      this.$apollo
        .query({
          query: creationTransactionList,
          variables: {
            currentPage: 1,
            pageSize: 25,
            order: 'DESC',
            userId: parseInt(this.userId),
          },
        })
        .then((result) => {
          this.items = result.data.creationTransactionList
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
  },
  created() {
    this.getTransactions()
  },
}
</script>
