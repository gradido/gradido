<template>
  <div class="bg-white appBoxShadow gradido-border-radius p-3">
    <div class="p-4" data-test="send-transaction-success-text">
      {{ $t('form.thx') }}
      <hr />
      {{ $t('form.send_transaction_success') }}
    </div>
    <div class="text-center mt-5">
      <b-button variant="primary" @click="$emit('on-reset')">{{ $t('form.close') }}</b-button>
    </div>
  </div>
</template>
<script>
export default {
  name: 'TransactionResultSendSuccess',
}
</script>
