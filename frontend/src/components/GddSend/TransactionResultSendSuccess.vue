<template>
  <b-container>
    <b-row>
      <b-col>
        <b-card class="p-0 gradido-custom-background">
          <div class="p-4">
            {{ $t('form.thx') }}
            <hr />
            {{ $t('form.send_transaction_success') }}
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
  name: 'TransactionResultSend',
}
</script>
