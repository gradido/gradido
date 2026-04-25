<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-4">
    <div>
      <div class="gradido-font-15rem">{{ $t('form.sorry') }}</div>
      <hr />

      <div class="test-send_transaction_error">{{ $t('form.send_email_error') }}</div>

      <hr />
      <div
        v-if="errorResult.includes('The recipient user was not found')"
        class="test-receiver-not-found"
      >
        {{ $t('form.sendemailerror.receiverNotFound') }}
      </div>
      <div
        v-else-if="errorResult.includes('The recipient account was deleted')"
        class="test-receiver-not-found"
      >
        {{ $t('form.sendemailerror.receiverDeleted') }}
      </div>
      <div
        v-else-if="errorResult.includes('The recipient community was not found')"
        class="test-receiver-not-found"
      >
        {{ $t('form.sendemailerror.receiverCommunityNotFound') }}
      </div>
      <div
        v-else-if="errorResult.includes('The recipient community has no federated communities')"
        class="test-receiver-not-found"
      >
        {{ $t('form.sendemailerror.receiverCommunityNoFederatedCommunities') }}
      </div>
      <div
        v-else-if="
          errorResult.includes('The federated community of the recipient community was not found')
        "
        class="test-receiver-not-found"
      >
        {{ $t('form.sendemailerror.federatedCommunityOfReceiverCommunityNotFound') }}
      </div>
      <div
        v-else-if="errorResult.includes('Failed to send command to federated community')"
        class="test-receiver-not-found"
      >
        {{ $t('form.sendemailerror.failedToSendCommandToFederatedCommunity') }}
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
