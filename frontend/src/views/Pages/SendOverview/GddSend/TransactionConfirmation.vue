<template>
  <div>
    <b-row v-if="selected === 'gift'">
      <b-alert class="mb-3 mt-3" show variant="muted">
        <h2 class="alert-heading">{{ $t('gdd_per_link.header') }}</h2>

        <div>
          Du verschenkst:
          <h1>{{ $n(amount, 'decimal') }} GDD</h1>
        </div>
      </b-alert>
    </b-row>
    <b-row v-else>
      <b-col>
        <div class="display-4 pb-4">{{ $t('form.send_check') }}</div>
        <b-list-group class="">
          <label class="input-1" for="input-1">{{ $t('form.recipient') }}</label>
          <b-input-group id="input-group-1" class="borderbottom" size="lg">
            <b-input-group-prepend class="d-none d-md-block gray-background">
              <b-icon icon="envelope" class="display-4 m-3"></b-icon>
            </b-input-group-prepend>
            <div class="p-3">{{ email }}</div>
          </b-input-group>
          <br />
          <label class="input-2" for="input-2">{{ $t('form.amount') }}</label>
          <b-input-group id="input-group-2" class="borderbottom" size="lg">
            <b-input-group-prepend class="p-2 d-none d-md-block gray-background">
              <div class="m-1 mt-2">GDD</div>
            </b-input-group-prepend>

            <div class="p-3">{{ $n(amount, 'decimal') }}</div>
          </b-input-group>

          <br />
          <label class="input-3" for="input-3">{{ $t('form.message') }}</label>
          <b-input-group id="input-group-3" class="borderbottom">
            <b-input-group-prepend class="d-none d-md-block gray-background">
              <b-icon icon="chat-right-text" class="display-4 m-3 mt-4"></b-icon>
            </b-input-group-prepend>
            <div class="p-3">{{ memo ? memo : '-' }}</div>
          </b-input-group>
        </b-list-group>
      </b-col>
    </b-row>

    <b-container class="bv-example-row mt-3 gray-background p-2">
      <p>{{ $t('advanced-calculation') }}</p>
      <b-row class="pr-3">
        <b-col class="text-right">{{ $t('form.current_balance') }}</b-col>
        <b-col class="text-right">{{ $n(balance, 'decimal') }}</b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col class="text-right">
          <strong>{{ $t('form.your_amount') }}</strong>
        </b-col>
        <b-col class="text-right">
          <strong>- {{ $n(amount, 'decimal') }}</strong>
        </b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col class="text-right">
          <strong>Vergänglichkeit für 14 Tage</strong>
        </b-col>
        <b-col class="text-right borderbottom">
          <strong>- {{ $n(amount * 0.028, 'decimal') }}</strong>
        </b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col class="text-right">{{ $t('form.new_balance') }}</b-col>
        <b-col v-if="selected === 'gift'" class="text-right">
          ~ {{ $n(balance - amount - amount * 0.028, 'decimal') }}
        </b-col>
        <b-col v-else class="text-right">~ {{ $n(balance - amount, 'decimal') }}</b-col>
      </b-row>
    </b-container>

    <b-row class="mt-4">
      <b-col>
        <b-button @click="$emit('on-reset')">{{ $t('form.cancel') }}</b-button>
      </b-col>
      <b-col class="text-right">
        <b-button
          variant="success"
          :disabled="loading"
          @click="
            selected === 'send' ? $emit('send-transaction') : $emit('send-transaction-per-link')
          "
        >
          {{ selected === 'send' ? $t('form.send_now') : $t('form.generate_now') }}
        </b-button>
      </b-col>
    </b-row>

    <b-alert class="mt-3" show v-show="selected === 'gift'" variant="muted">
      <h2 class="alert-heading">{{ $t('gdd_per_link.header') }}</h2>

      <p>
        -
        <b>{{ $t('gdd_per_link.sentence_2') }}</b>
      </p>
      <p>
        -
        <b>{{ $t('gdd_per_link.sentence_3') }}</b>
      </p>
      <p>
        -
        <b>{{ $t('gdd_per_link.sentence_4') }}</b>
      </p>

      <hr />
      <p class="mb-0">
        {{ $t('gdd_per_link.sentence_5') }}
      </p>
    </b-alert>
  </div>
</template>
<script>
export default {
  name: 'TransactionConfirmation',
  props: {
    balance: { type: Number, default: 0 },
    email: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    memo: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    selected: { type: String, required: false },
    transactions: {
      default: () => [],
    },
  },
  data() {
    return {
      decay: this.transactions[0].balance,
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
