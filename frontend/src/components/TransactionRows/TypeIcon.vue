<template>
  <div class="type-icon">
    <div class="gdd-transaction-list-item-icon">
      <b-icon :icon="icon" :class="color" class="m-mb-1 font2em" />
      <b-icon
        v-if="transactionLinkId"
        icon="link45deg"
        variant="muted"
        class="m-mb-1"
        :title="$t('gdd_per_link.redeemed-title')"
      />
    </div>
  </div>
</template>
<script>
export default {
  name: 'TypeIcon',
  props: {
    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    transactionLinkId: {
      type: Number,
      required: false,
      default: null,
    },
  },
}
</script>
