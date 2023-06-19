<template>
  <div class="bg-white appBoxShadow gradido-border-radius p-3">
    <div class="p-4" data-test="send-transaction-success-text">
      {{ $t('form.thx') }}
      <hr />
      {{ $t('form.send_transaction_success') }}
    </div>
   success text: {{ text }}
    <b-container>
      <div class="card">
        <hello-iota :text="text" :send="true" />
      </div>
    </b-container>
    <div class="text-center mt-5">
      <b-button variant="primary" @click="$emit('on-back')">{{ $t('form.close') }}</b-button>
    </div>
  </div>
</template>
<script>
import HelloIota from '@/components/HelloIota.vue'

export default {
  name: 'TransactionResultSendSuccess',
  components: { HelloIota },
  props: {
    text: { type: String, required: true },
  },
}
</script>
