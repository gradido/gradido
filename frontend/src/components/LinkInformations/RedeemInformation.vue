<template>
  <div class="redeem-information">
    <b-jumbotron bg-variant="muted" text-variant="dark" border-variant="info">
      <h1>
        {{ firstName }}
        {{ $t('transaction-link.send_you') }} {{ amount | GDD }}
      </h1>
      <b>{{ memo }}</b>
    </b-jumbotron>
  </div>
</template>
<script>
export default {
  name: 'RedeemInformation',
  props: {
    firstName: { type: String, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true, default: '' },
  },
}
</script>
