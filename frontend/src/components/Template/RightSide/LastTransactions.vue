<template>
  <div class="rightside-last-transactions">
    <b-row>
      <b-col>Letzte Transaktionen:</b-col>
      <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col>
    </b-row>
    <!-- {{ transactions }} -->
    <div class="d-flex mt-3 mb-3" v-for="transaction in transactions" :key="transaction.id">
      <div class="mr-3"><b-avatar></b-avatar></div>
      <div class="d-inline">
        <div>{{ transaction.typeId }}</div>
        <div>{{ transaction.amount }}</div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'LastTransactions',
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
}
</script>
