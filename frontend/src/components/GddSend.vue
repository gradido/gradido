<template>
  <div class="gdd-send">
    <slot :name="currentTransactionStep" />
  </div>
</template>
<script>
export const TRANSACTION_STEPS = {
  transactionForm: 'transactionForm',
  transactionConfirmationSend: 'transactionConfirmationSend',
  transactionConfirmationLink: 'transactionConfirmationLink',
  transactionResultSendSuccess: 'transactionResultSendSuccess',
  transactionResultSendError: 'transactionResultSendError',
  transactionResultLink: 'transactionResultLink',
  sendEmailResultSuccess: 'sendEmailResultSuccess',
  sendEmailResultError: 'sendEmailResultError',
}

export default {
  name: 'GddSend',
  props: {
    currentTransactionStep: {
      type: String,
      default: TRANSACTION_STEPS.transactionForm,
      validator: (transactionStep) => TRANSACTION_STEPS[transactionStep] !== undefined,
    },
  },
}
</script>
