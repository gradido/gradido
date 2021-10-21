<template>
  <div class="gdd-status">
    <div class="p-0 gdd-status-div">
      {{ pending ? '—' : $n(balance, 'decimal') }} {{ statusText }}
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
