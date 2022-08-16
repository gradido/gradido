<template>
  <div class="transaction-confirm-link">
    <b-row class="confirm-box-link">
      <b-col class="text-right mt-4 mb-3">
        <div class="alert-heading text-left h3">{{ $t('gdd_per_link.header') }}</div>

        <h1>{{ (amount * -1) | GDD }}</h1>
        <b class="mt-2">{{ memo }}</b>
      </b-col>
    </b-row>

    <b-container class="bv-example-row mt-3 mb-3 gray-background p-2">
      <div class="alert-heading text-left h3">{{ $t('advanced-calculation') }}</div>
      <b-row class="pr-3">
        <b-col class="text-right">{{ $t('form.current_balance') }}</b-col>
        <b-col class="text-right">{{ balance | GDD }}</b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col class="text-right">
          <strong>{{ $t('form.your_amount') }}</strong>
        </b-col>
        <b-col class="text-right">
          <strong>{{ (amount * -1) | GDD }}</strong>
        </b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col class="text-right">
          <strong>{{ $t('gdd_per_link.decay-14-day') }}</strong>
        </b-col>
        <b-col class="text-right borderbottom">
          <strong>{{ $t('math.aprox') }} {{ (amount * -0.028) | GDD }}</strong>
        </b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col class="text-right">{{ $t('form.new_balance') }}</b-col>
        <b-col class="text-right">{{ $t('math.aprox') }} {{ totalBalance | GDD }}</b-col>
      </b-row>
    </b-container>

    <b-row class="mt-4">
      <b-col>
        <b-button @click="$emit('on-reset')">{{ $t('back') }}</b-button>
      </b-col>
      <b-col class="text-right">
        <b-button class="send-button" variant="primary" :disabled="disabled" @click="$emit('send-transaction')">
          {{ $t('form.generate_now') }}
        </b-button>
      </b-col>
    </b-row>
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
  border-bottom: 1px solid rgb(70, 65, 65);
  border-bottom-style: double;
}
</style>
