<template>
  <div class="redeem-logged-out">
    <redeem-information v-bind="linkData" :isContributionLink="isContributionLink" />

    <b-jumbotron>
      <div class="mb-2">
        <h2>{{ $t('gdd_per_link.redeem') }}</h2>
      </div>

      <b-row>
        <b-col sm="12" md="6">
          <p>{{ $t('gdd_per_link.no-account') }}</p>
          <b-button variant="primary" :to="register">
            {{ $t('gdd_per_link.to-register') }}
          </b-button>
        </b-col>
        <b-col sm="12" md="6" class="mt-4 mt-lg-0">
          <p>{{ $t('gdd_per_link.has-account') }}</p>
          <b-button variant="gradido" :to="login">{{ $t('gdd_per_link.to-login') }}</b-button>
        </b-col>
      </b-row>
    </b-jumbotron>
  </div>
</template>
<script>
import RedeemInformation from '@/components/LinkInformations/RedeemInformation.vue'
import { authLinks } from '@/mixins/authLinks'

export default {
  name: 'RedeemLoggedOut',
  mixins: [authLinks],
  components: {
    RedeemInformation,
  },
  props: {
    linkData: { type: Object, required: true },
    isContributionLink: { type: Boolean, default: false },
  },
}
</script>
