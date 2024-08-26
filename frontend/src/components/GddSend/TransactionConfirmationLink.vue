<template>
  <div class="transaction-confirm-link">
    <div class="bg-white app-box-shadow gradido-border-radius p-3">
      <div class="h3 mb-4">{{ $t('gdd_per_link.header') }}</div>
      <BRow class="mt-5">
        <BCol offset="2">
          <div class="mt-3 h5">{{ $t('form.memo') }}</div>
          <div>{{ memo }}</div>
        </BCol>
        <BCol cols="3">
          <div class="small">{{ $t('send_gdd') }}</div>
          <div>{{ $filters.GDD(amount) }}</div>
        </BCol>
      </BRow>

      <BRow class="mt-5 pe-3 text-color-gdd-yellow h3">
        <BCol cols="2" class="text-end">
          <variant-icon icon="droplet-half" variant="gold" />
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
            class="send-button"
            variant="gradido"
            :disabled="disabled"
            @click="$emit('send-transaction')"
          >
            {{ $t('form.generate_now') }}
          </BButton>
        </BCol>
      </BRow>
    </div>
  </div>
</template>
<script>
export default {
  name: 'TransactionConfirmationLink',
  props: {
    balance: { type: Number, required: true },
    email: { type: String, required: false, default: '' },
    amount: { type: Number, required: true },
    memo: { type: String, required: true },
    loading: { type: Boolean, required: true },
  },
  computed: {
    totalBalance() {
      return this.balance - this.amount * 1.028
    },
    disabled() {
      if (this.totalBalance < 0) {
        return true
      }
      return this.loading
    },
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
