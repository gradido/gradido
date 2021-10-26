<template>
  <div class="gdd-send">
    <slot :name="transactionSteps[currentTransactionStep]" />
  </div>
</template>
<script>
export default {
  name: 'GddSend',
  data() {
    return {
      transactionSteps: ['transaction-form', 'transaction-confirmation', 'transaction-result'],
    }
  },
  props: {
    currentTransactionStep: { type: Number, default: 0 },
  },
}
</script>
