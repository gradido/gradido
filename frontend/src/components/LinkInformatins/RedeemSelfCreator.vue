<template>
  <div class="redeem-self-creator">
    <b-jumbotron bg-variant="info" text-variant="dark" border-variant="dark">
      <h1>
        {{ user.firstName }}
        {{ $t('transaction-link.send_you') }} {{ amount | GDD }}
      </h1>
      <b>{{ memo }}</b>
    </b-jumbotron>

    <b-jumbotron>
      <div class="mb-3 text-center">
        <div class="mt-3">
          {{ $t('gdd_per_link.no-redeem') }}
          <a to="/transactions" href="#!">
            <b>{{ $t('gdd_per_link.link-overview') }}</b>
          </a>
        </div>
      </div>
    </b-jumbotron>
  </div>
</template>
<script>
export default {
  name: 'RedeemSelfCreator',
  props: {
    user: { type: Object, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true, default: '' },
  },
}
</script>
