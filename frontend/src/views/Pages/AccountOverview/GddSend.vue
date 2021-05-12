<template>
  <div class="gdd-send">
    <slot :name="currentTransactionStep" />
  </div>
</template>
<script>
export default {
  name: 'GddSend',
  props: {
    currentTransactionStep: { type: String, default: 'transaction-form' },
  },
}
</script>
