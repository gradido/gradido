<template>
  <div>
    <b-row>
      <b-col>
        <div class="display-4 pb-4">{{ $t('form.send_check') }}</div>
        <b-list-group class="">
          <label class="input-1" for="input-1">{{ $t('form.recipient') }}</label>
          <b-input-group id="input-group-1" class="border border-default" size="lg">
            <b-input-group-prepend class="d-none d-md-block gray-background">
              <b-icon icon="envelope" class="display-4 m-3"></b-icon>
            </b-input-group-prepend>
            <div class="p-3">{{ email }}</div>
          </b-input-group>
          <br />
          <label class="input-2" for="input-2">{{ $t('form.amount') }}</label>
          <b-input-group id="input-group-2" class="border border-default" size="lg">
            <b-input-group-prepend class="p-2 d-none d-md-block gray-background">
              <div class="m-1 mt-2">GDD</div>
            </b-input-group-prepend>

            <div class="p-3">{{ $n(amount, 'decimal') }}</div>
          </b-input-group>

          <br />
          <label class="input-3" for="input-3">{{ $t('form.message') }}</label>
          <b-input-group id="input-group-3" class="border border-default">
            <b-input-group-prepend class="d-none d-md-block gray-background">
              <b-icon icon="chat-right-text" class="display-4 m-3 mt-4"></b-icon>
            </b-input-group-prepend>
            <div class="p-3">{{ memo ? memo : '-' }}</div>
          </b-input-group>
        </b-list-group>
      </b-col>
    </b-row>

    <b-container class="bv-example-row mt-3 gray-background p-2">
      <b-row>
        <b-col></b-col>
        <b-col>{{ $t('form.current_balance') }}</b-col>
        <b-col>{{ $n(balance, 'decimal') }}</b-col>
      </b-row>
      <b-row>
        <b-col></b-col>
        <b-col>
          <strong>{{ $t('form.your_amount') }}</strong>
        </b-col>
        <b-col>
          <strong>- {{ $n(amount, 'decimal') }}</strong>
        </b-col>
      </b-row>
      <b-row>
        <b-col></b-col>
        <b-col>{{ $t('decay.decay') }}</b-col>
        <b-col style="border-bottom: double">- {{ $n(decay, 'decimal') }}</b-col>
      </b-row>

      <b-row>
        <b-col></b-col>
        <b-col>{{ $t('form.new_balance') }}</b-col>
        <b-col>~ {{ $n(balance - amount - decay, 'decimal') }}</b-col>
      </b-row>
    </b-container>

    <b-row class="mt-4">
      <b-col>
        <b-button @click="$emit('on-reset')">{{ $t('form.cancel') }}</b-button>
      </b-col>
      <b-col class="text-right">
        <b-button variant="success" :disabled="loading" @click="$emit('send-transaction')">
          {{ $t('form.send_now') }}
        </b-button>
      </b-col>
    </b-row>
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
  background-color: #ebebeba3 !important;
}
</style>
