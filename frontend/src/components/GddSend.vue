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
      transactionSteps: [
        'transaction-form',
        'transaction-confirmation-send',
        'transaction-confirmation-link',
        'transaction-result-send-success',
        'transaction-result-send-error',
        'transaction-result-link',
      ],
    }
  },
  props: {
    currentTransactionStep: { type: Number, default: 0 },
  },
}
</script>
