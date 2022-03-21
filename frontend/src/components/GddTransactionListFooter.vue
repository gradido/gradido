<template>
  <div>
    <b-list-group>
      <b-list-group-item v-if="count > 5">
        <!-- eslint-disable @intlify/vue-i18n/no-v-html -->
        <router-link
          to="/transactions"
          v-html="$t('transaction.show_all', { count })"
        ></router-link>
        <!-- eslint-enable @intlify/vue-i18n/no-v-html -->
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: 'GddTransactionListFooter',
  props: {
    count: { count: Number },
  },
}
</script>
