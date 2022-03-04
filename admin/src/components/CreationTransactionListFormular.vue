<template>
  <div class="component-creation-transaction-list">
    {{ $t('transactionlist.title') }}
    <b-table striped hover :fields="fields" :items="items"></b-table>
  </div>
</template>
<script>
import { transactionList } from '../graphql/transactionList'
export default {
  name: 'CreationTransactionList',
  props: {
    userId: { type: Number, required: true },
  },
  data() {
    return {
      fields: [
        {
          key: 'date',
          label: this.$t('transactionlist.date'),
          formatter: (value, key, item) => {
            return this.$d(new Date(value))
          },
        },
        {
          key: 'balance',
          label: this.$t('transactionlist.amount'),
          formatter: (value, key, item) => {
            return `${value} GDD`
          },
        },
        { key: 'name', label: this.$t('transactionlist.community') },
        { key: 'memo', label: this.$t('transactionlist.memo') },
        {
          key: 'decay',
          label: this.$t('transactionlist.decay'),
          formatter: (value, key, item) => {
            if (value && value.balance >= 0) {
              return value.balance
            } else {
              return '0'
            }
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
          query: transactionList,
          variables: {
            currentPage: 1,
            pageSize: 25,
            order: 'DESC',
            onlyCreations: true,
            userId: parseInt(this.userId),
          },
        })
        .then((result) => {
          console.log('getTransactions', result.data)
          this.items = result.data.transactionList.transactions.filter((t) => t.type === 'creation')
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
