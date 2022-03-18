<template>
  <div class="redeem-logged-out">
    <b-jumbotron bg-variant="info" text-variant="dark" border-variant="dark">
      <h1>
        {{ user.firstName }}
        {{ $t('transaction-link.send_you') }} {{ amount | GDD }}
      </h1>
      <b>{{ memo }}</b>
    </b-jumbotron>

    <b-jumbotron>
      <div class="mb-6">
        <h2>{{ $t('gdd_per_link.redeem') }}</h2>
      </div>

      <b-row>
        <b-col col sm="12" md="6">
          <p>{{ $t('gdd_per_link.no-account') }}</p>
          <b-button variant="primary" to="/register">
            {{ $t('gdd_per_link.to-register') }}
          </b-button>
        </b-col>
        <b-col sm="12" md="6" class="mt-xs-6 mt-sm-6 mt-md-0">
          <p>{{ $t('gdd_per_link.has-account') }}</p>
          <b-button variant="info" to="/login">{{ $t('gdd_per_link.to-login') }}</b-button>
        </b-col>
      </b-row>
    </b-jumbotron>
  </div>
</template>
<script>
export default {
  name: 'RedeemLoggedOut',
  props: {
    user: { type: Object, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true, default: '' },
  },
}
</script>
