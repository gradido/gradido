<template>
  <div>
    <div class="container-fluid">
      <community-news class="mb-5 shadow" />
      <gdd-transaction-list
        :transactions="transactions"
        :pageSize="5"
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        :transactionLinkCount="transactionLinkCount"
        :pending="pending"
        v-on="$listeners"
      />
      <gdd-transaction-list-footer :count="transactionCount" />
    </div>
  </div>
</template>
<script>
import CommunityNews from '@/components/Overview/CommunityNews.vue'
import GddTransactionList from '@/components/GddTransactionList.vue'
import GddTransactionListFooter from '@/components/GddTransactionListFooter.vue'

export default {
  name: 'Overview',
  components: {
    CommunityNews,
    GddTransactionList,
    GddTransactionListFooter,
  },
  data() {
    return {
      timestamp: Date.now(),
    }
  },
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
    pending: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    // updateTransactions(pagination) {
    //   this.$emit('update-transactions', pagination)
    // },
  },
}
</script>
<style>
.g-border {
  border: #ffffff 2px;
  border-style: inset;
  border-radius: 5px;
}
</style>
