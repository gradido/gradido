<template>
  <div class="component-creation-transaction-list">
    Alle Geschöpften Transaktionen für den User
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
          console.log('Something went wrong', error)
        })
    },
  },
  created() {
    this.getTransactions()
  },
}
</script>
