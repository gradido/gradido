<template>
  <div class="transaction-confirm-send">
    <div class="bg-white appBoxShadow gradido-border-radius p-3">
      <div class="h3 mb-4">{{ $t('form.send_check') }}</div>
      <b-row class="mt-5">
        <b-col cols="2"></b-col>
        <b-col>
          <div class="h4">
            {{ email }}
          </div>
          <div class="mt-3 h5">{{ $t('form.memo') }}</div>
          <div>{{ memo }}</div>
        </b-col>
        <b-col cols="3">
          <div class="small">{{ $t('send_gdd') }}</div>
          <div>{{ amount | GDD }}</div>
        </b-col>
      </b-row>

      <b-row class="mt-5 text-color-gdd-yellow h3">
        <b-col cols="2" class="text-right">
          <b-icon class="text-color-gdd-yellow" icon="droplet-half"></b-icon>
        </b-col>
        <b-col>{{ $t('advanced-calculation') }}</b-col>
      </b-row>
      <b-row class="pr-3" offset="2">
        <b-col offset="2">{{ $t('form.current_balance') }}</b-col>
        <b-col>{{ balance | GDD }}</b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col offset="2">
          <strong>{{ $t('form.your_amount') }}</strong>
        </b-col>
        <b-col class="borderbottom">
          <strong>{{ (amount * -1) | GDD }}</strong>
        </b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col offset="2">{{ $t('form.new_balance') }}</b-col>
        <b-col>{{ (balance - amount) | GDD }}</b-col>
      </b-row>
      <b-row class="mt-5">
        <b-col cols="12" md="6" lg="6">
          <b-button block @click="$emit('on-back')" class="mb-3 mb-md-0 mb-lg-0">
            {{ $t('back') }}
          </b-button>
        </b-col>
        <b-col cols="12" md="6" lg="6" class="text-lg-right">
          <b-button
            block
            variant="gradido"
            :disabled="disabled"
            @click="$emit('send-transaction'), (disabled = true)"
          >
            {{ $t('form.send_now') }}
          </b-button>
        </b-col>
      </b-row>
    </div>
  </div>
</template>
<script>
export default {
  name: 'TransactionConfirmationSend',
  props: {
    balance: { type: Number, required: true },
    email: { type: String, required: false, default: '' },
    amount: { type: Number, required: true },
    memo: { type: String, required: true },
  },
  data() {
    return {
      disabled: false,
    }
  },
}
</script>
<style>
.gray-background {
  background-color: #ecebe6a3 !important;
}
.borderbottom {
  border-bottom: 1px solid rgb(70, 65, 65);
  border-bottom-style: double;
}
</style>
