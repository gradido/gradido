<template>
  <b-list-group>
    <b-list-group-item v-show="transactionCount > 5">
      <router-link
        to="/transactions"
        v-html="$t('transaction.show_all', { count: transactionCount })"
      ></router-link>
    </b-list-group-item>
  </b-list-group>
</template>
<script>
export default {
  props: {
    transactionCount: { type: Number, default: 0 },
  },
}
</script>
