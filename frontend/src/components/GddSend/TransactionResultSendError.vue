<template>
  <b-container>
    <b-row>
      <b-col>
        <b-card class="p-0 gradido-custom-background">
          <div class="p-4 gradido-font-15rem">
            <div>{{ $t('form.sorry') }}</div>
            <hr />

            <div class="test-send_transaction_error">{{ $t('form.send_transaction_error') }}</div>

            <hr />
            <div class="test-receiver-not-found" v-if="errorResult === 'recipient not known'">
              {{ $t('transaction.receiverNotFound') }}
            </div>
            <div
              class="test-receiver-not-found"
              v-if="errorResult === 'GraphQL error: The recipient account was deleted'"
            >
              {{ $t('transaction.receiverDeleted') }}
            </div>
            <div v-else>{{ errorResult }}</div>
          </div>
          <p class="text-center mt-3">
            <b-button variant="success" @click="$emit('on-reset')">{{ $t('form.close') }}</b-button>
          </p>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
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
