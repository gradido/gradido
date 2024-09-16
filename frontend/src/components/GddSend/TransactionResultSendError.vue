<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-4">
    <div>
      <div class="gradido-font-15rem">{{ $t('form.sorry') }}</div>
      <hr />

      <div class="test-send_transaction_error">{{ $t('form.send_transaction_error') }}</div>

      <hr />
      <div v-if="errorResult === 'recipient not known'" class="test-receiver-not-found">
        {{ $t('transaction.receiverNotFound') }}
      </div>
      <div
        v-if="errorResult === 'GraphQL error: The recipient account was deleted'"
        class="test-receiver-not-found"
      >
        {{ $t('transaction.receiverDeleted') }}
      </div>
      <div v-else>{{ errorResult }}</div>
    </div>
    <p class="text-center mt-5">
      <BButton variant="secondary" @click="$emit('on-back')">
        {{ $t('form.close') }}
      </BButton>
    </p>
  </div>
</template>
<script>
export default {
  name: 'TransactionResultSendError',
  props: {
    error: { type: Boolean, default: false },
    errorResult: { type: String, default: '' },
  },
}
</script>
