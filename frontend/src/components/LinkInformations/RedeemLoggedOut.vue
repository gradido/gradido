<template>
  <div class="redeem-logged-out">
    <redeem-information :firstName="user.firstName" :amount="amount" :memo="memo" />

    <b-jumbotron>
      <div class="mb-6">
        <h2>{{ $t('gdd_per_link.redeem') }}</h2>
      </div>

      <b-row>
        <b-col col sm="12" md="6">
          <p>{{ $t('gdd_per_link.no-account') }}</p>
          <b-button variant="primary" :to="register">
            {{ $t('gdd_per_link.to-register') }}
          </b-button>
        </b-col>
        <b-col sm="12" md="6" class="mt-xs-6 mt-sm-6 mt-md-0">
          <p>{{ $t('gdd_per_link.has-account') }}</p>
          <b-button variant="info" :to="login">{{ $t('gdd_per_link.to-login') }}</b-button>
        </b-col>
      </b-row>
    </b-jumbotron>
  </div>
</template>
<script>
import RedeemInformation from '@/components/LinkInformations/RedeemInformation.vue'

export default {
  name: 'RedeemLoggedOut',
  components: {
    RedeemInformation,
  },
  props: {
    user: { type: Object, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true, default: '' },
  },
  computed: {
    login() {
      return '/login/' + this.$route.params.code
    },
    register() {
      return '/register/' + this.$route.params.code
    },
  },
}
</script>
