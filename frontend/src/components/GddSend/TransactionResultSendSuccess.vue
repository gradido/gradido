<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-3">
    <div class="p-4" data-test="send-transaction-success-text">
      {{ $t('form.thx') }}
      <hr />
      {{ $t('form.send_transaction_success') }}
    </div>
    <div class="text-center mt-5">
      <BButton variant="primary" @click="$emit('on-back')">
        {{ $t('form.close') }}
      </BButton>
    </div>
  </div>
</template>
<script>
export default {
  name: 'TransactionResultSendSuccess',
}
</script>
