<template>
  <div>
    <b-row>
      <b-col>
        <div class="display-4 p-4">{{ $t('form.send_check') }}</div>
        <b-list-group>
          <b-list-group-item class="d-flex justify-content-between align-items-center">
            {{ email }}
            <b-badge variant="primary" pill>{{ $t('form.receiver') }}</b-badge>
          </b-list-group-item>
          <b-list-group-item class="d-flex justify-content-between align-items-center">
            {{ $n(amount, 'decimal') }} GDD
            <b-badge variant="primary" pill>{{ $t('form.amount') }}</b-badge>
          </b-list-group-item>
          <b-list-group-item class="d-flex justify-content-between align-items-center">
            {{ memo ? memo : '-' }}
            <b-badge variant="primary" pill>{{ $t('form.message') }}</b-badge>
          </b-list-group-item>
          <b-list-group-item class="d-flex justify-content-between align-items-center">
            {{ $d($moment(date), 'long') }}
            <b-badge variant="primary" pill>{{ $t('form.date') }}</b-badge>
          </b-list-group-item>
        </b-list-group>
      </b-col>
    </b-row>
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
    email: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    memo: { type: String, default: '' },
    date: { type: String, default: '' },
    loading: { type: Boolean, default: false },
  },
}
</script>
