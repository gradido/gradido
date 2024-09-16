<template>
  <div class="gdd-status">
    <div class="p-0 gdd-status-div">
      <IBiThreeDots v-if="pending" animation="cylon" font-scale="4" class="test-pending-icon" />
      <div v-else>
        {{ pending || balance === null ? $t('em-dash') : $n(balance, 'decimal') }} {{ statusText }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Status',
  props: {
    balance: { type: Number, default: 0 },
    pending: {
      type: Boolean,
      default: true,
    },
    statusText: {
      type: String,
      default: '',
    },
  },
}
</script>
