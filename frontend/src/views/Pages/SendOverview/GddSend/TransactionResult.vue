<template>
  <b-row v-if="!error">
    <b-col>
      <b-card class="p-0" id="trans-res-style-1">
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
  <b-row v-else>
    <b-col>
      <b-card class="p-0" id="trans-res-style-2">
        <div class="p-4" id="trans-res-style-3">
          <div>{{ $t('form.sorry') }}</div>
          <hr />

          <div class="test-send_transaction_error">{{ $t('form.send_transaction_error') }}</div>

          <hr />
          <div class="test-receiver-not-found" v-if="errorResult === 'recipiant not known'">
            {{ $t('transaction.receiverNotFound') }}
          </div>
          <div v-else>({{ errorResult }})</div>
        </div>
        <p class="text-center mt-3">
          <b-button variant="success" @click="$emit('on-reset')">{{ $t('form.close') }}</b-button>
        </p>
      </b-card>
    </b-col>
  </b-row>
</template>
<script>
export default {
  name: 'TransactionResult',
  props: {
    error: { type: Boolean, default: true },
    errorResult: { type: String, default: '' },
  },
}
</script>
<style>
#trans-res-style-1 {
  background-color: #ebebeba3 !important;
}
#trans-res-style-2 {
  background-color: #ebebeba3 !important;
}
#trans-res-style-2 {
  font-size: 1.5rem;
}
</style>
