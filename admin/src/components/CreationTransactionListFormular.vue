<template>
  <div class="component-creation-transaction-list">
    {{ $t('transactionlist.title') }}
    <b-table striped hover :items="items"></b-table>
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
          this.items = result.data.transactionList.transactions
        })
        .catch((error) => {
          this.$toasted.global.error(error.message)
        })
    },
  },
  created() {
    this.getTransactions()
  },
}
</script>
