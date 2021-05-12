<template>
  <b-row>
    <b-col>
      <div class="display-4 p-4">{{ $t('form.send_check') }}</div>
      <b-list-group>
        <b-list-group-item class="d-flex justify-content-between align-items-center">
          {{ email }}
          <b-badge variant="primary" pill>{{ $t('form.receiver') }}</b-badge>
        </b-list-group-item>
        <b-list-group-item class="d-flex justify-content-between align-items-center">
          {{ amount }} GDD
          <b-badge variant="primary" pill>{{ $t('form.amount') }}</b-badge>
        </b-list-group-item>
        <b-list-group-item class="d-flex justify-content-between align-items-center">
          {{ memo ? memo : '-' }}
          <b-badge variant="primary" pill>{{ $t('form.message') }}</b-badge>
        </b-list-group-item>
        <b-list-group-item class="d-flex justify-content-between align-items-center">
          {{ date }}
          {{ $moment(date).format('DD.MM.YYYY - HH:mm:ss') }}
          <b-badge variant="primary" pill>{{ $t('form.date') }}</b-badge>
        </b-list-group-item>
      </b-list-group>
      <hr />
      <b-row>
        <b-col>
          <b-button @click="$emit('on-reset')">{{ $t('form.cancel') }}</b-button>
        </b-col>
        <b-col class="text-right">
          <b-button variant="success" @click="$emit('send-transaction')">
            {{ $t('form.send_now') }}
          </b-button>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>
<script>
export default {
  name: 'TransactionConfirmation',
  props: {
    email: { type: String, default: '' },
    amount: { type: String, default: '' },
    memo: { type: String, default: '' },
    date: { type: String, default: '' },
  },
}
</script>
