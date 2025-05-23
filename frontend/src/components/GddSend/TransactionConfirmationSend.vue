<template>
  <div class="transaction-confirm-send">
    <div class="bg-white app-box-shadow gradido-border-radius p-3">
      <div class="h3 mb-4">{{ $t('form.send_check') }}</div>
      <BRow class="mt-5">
        <BCol cols="12">
          <BRow class="mt-3">
            <BCol class="h5">{{ $t('form.recipientCommunity') }}</BCol>
            <BCol>{{ targetCommunity.name }}</BCol>
          </BRow>
          <BRow>
            <BCol class="h5">{{ $t('form.recipient') }}</BCol>
            <BCol>{{ userName ? userName : identifier }}</BCol>
          </BRow>
          <BRow>
            <BCol class="h5">{{ $t('form.amount') }}</BCol>
            <BCol>{{ $filters.GDD(amount) }}</BCol>
          </BRow>
          <BRow>
            <BCol class="h5">{{ $t('form.memo') }}</BCol>
            <BCol>{{ memo }}</BCol>
          </BRow>
        </BCol>
      </BRow>

      <BRow class="mt-5 text-color-gdd-yellow h3">
        <BCol cols="2" class="text-end">
          <IBiDropletHalf />
        </BCol>
        <BCol>{{ $t('advanced-calculation') }}</BCol>
      </BRow>
      <BRow class="pe-3" offset="2">
        <BCol offset="2">{{ $t('form.current_balance') }}</BCol>
        <BCol>{{ $filters.GDD(balance) }}</BCol>
      </BRow>
      <BRow class="pe-3">
        <BCol offset="2">
          <strong>{{ $t('form.your_amount') }}</strong>
        </BCol>
        <BCol class="borderbottom">
          <strong>{{ $filters.GDD(amount * -1) }}</strong>
        </BCol>
      </BRow>
      <BRow class="pe-3">
        <BCol offset="2">{{ $t('form.new_balance') }}</BCol>
        <BCol>{{ $filters.GDD(balance - amount) }}</BCol>
      </BRow>
      <BRow class="mt-5">
        <BCol cols="12" md="6" lg="6">
          <BButton block class="mb-3 mb-md-0 mb-lg-0" @click="$emit('on-back')">
            {{ $t('back') }}
          </BButton>
        </BCol>
        <BCol cols="12" md="6" lg="6" class="text-lg-end">
          <BButton
            block
            variant="gradido"
            :disabled="disabled"
            @click="$emit('send-transaction'), (disabled = true)"
          >
            {{ $t('form.send_now') }}
          </BButton>
        </BCol>
      </BRow>
    </div>
  </div>
</template>
<script>
import CONFIG from '@/config'

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
        return { uuid: '', name: CONFIG.COMMUNITY_NAME }
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
  border-bottom: 1px solid rgb(70 65 65);
  border-bottom-style: double;
}
</style>
