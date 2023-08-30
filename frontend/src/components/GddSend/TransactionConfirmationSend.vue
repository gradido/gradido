<template>
  <div class="transaction-confirm-send">
    <div class="bg-white appBoxShadow gradido-border-radius p-3">
      <div class="h3 mb-4">{{ $t('form.send_check') }}</div>
      <b-row class="mt-5">
        <b-col cols="12">
          <b-row class="mt-3">
            <b-col class="h5">{{ $t('form.recipientCommunity') }}</b-col>
            <b-col>{{ targetCommunity.name }}</b-col>
          </b-row>
          <b-row>
            <b-col class="h5">{{ $t('form.recipient') }}</b-col>
            <b-col>{{ userName ? userName : identifier }}</b-col>
          </b-row>
          <b-row>
            <b-col class="h5">{{ $t('form.amount') }}</b-col>
            <b-col>{{ amount | GDD }}</b-col>
          </b-row>
          <b-row>
            <b-col class="h5">{{ $t('form.memo') }}</b-col>
            <b-col>{{ memo }}</b-col>
          </b-row>
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
import { COMMUNITY_NAME } from '@/config'

export default {
  name: 'TransactionConfirmationSend',
  props: {
    balance: { type: Number, required: true },
    identifier: { type: String, required: false, default: '' },
    amount: { type: Number, required: true },
    memo: { type: String, required: true },
    userName: { type: String, default: '' },
    targetCommunity: {
      type: Object,
      default: function () {
        return { uuid: '', name: COMMUNITY_NAME }
      },
    },
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
