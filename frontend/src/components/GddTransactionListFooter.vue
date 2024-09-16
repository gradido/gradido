<template>
  <div>
    <BListGroup>
      <BListGroupItem v-if="count > 5">
        <!-- eslint-disable @intlify/vue-i18n/no-v-html -->
        <router-link
          to="/transactions"
          v-html="$t('transaction.show_all', { count })"
        ></router-link>
        <!-- eslint-enable @intlify/vue-i18n/no-v-html -->
      </BListGroupItem>
    </BListGroup>
  </div>
</template>

<script>
export default {
  name: 'GddTransactionListFooter',
  props: {
    count: { type: Number },
  },
}
</script>
