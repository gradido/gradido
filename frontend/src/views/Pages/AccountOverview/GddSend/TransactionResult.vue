<template>
  <b-row v-if="!error">
    <b-col>
      <b-card class="p-0 p-md-3" style="background-color: #ebebeba3 !important">
        <div class="display-2 p-4">
          {{ $t('form.thx') }}
          <hr />
          {{ $t('form.send_transaction_success') }}
        </div>
        <p class="text-center">
          <b-button variant="success" @click="$emit('on-reset')">{{ $t('form.close') }}</b-button>
        </p>
      </b-card>
    </b-col>
  </b-row>
  <b-row v-else>
    <b-col>
      <b-card class="p-0 p-md-3" style="background-color: #ebebeba3 !important">
        <div class="display-2 p-4">
          {{ $t('form.sorry') }}
          <hr />
          {{ $t('form.send_transaction_error') }}
        </div>
        <p class="text-center">
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
  },
}
</script>
