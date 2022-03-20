<template>
  <div class="redeem-valid">
    <b-jumbotron bg-variant="muted" text-variant="dark" border-variant="info">
      <h1>
        {{ user.firstName }}
        {{ $t('transaction-link.send_you') }} {{ amount | GDD }}
      </h1>
      <b>{{ memo }}</b>
    </b-jumbotron>

    <b-jumbotron>
      <div class="mb-3 text-center">
        <b-button variant="primary" @click="$emit('redeem-link', id, amount)" size="lg">
          {{ $t('gdd_per_link.redeem') }}
        </b-button>
      </div>
    </b-jumbotron>
  </div>
</template>
<script>
export default {
  name: 'RedeemValid',
  props: {
    id: { type: Number, required: false },
    user: { type: Object, required: false },
    amount: { type: String, required: false },
    memo: { type: String, required: false, default: '' },
  },
}
</script>
