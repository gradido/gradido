<template>
  <div class="redeem-information">
    <b-jumbotron bg-variant="muted" text-variant="dark" border-variant="info">
      <h1 v-if="isContributionLink">
        {{ CONFIG.COMMUNITY_NAME }}
        {{ $t('contribution-link.thanksYouWith') }} {{ amount | GDD }}
      </h1>
      <h1 v-else>
        {{ user.firstName }}
        {{ $t('transaction-link.send_you') }} {{ amount | GDD }}
      </h1>
      <b>{{ memo }}</b>
    </b-jumbotron>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'RedeemInformation',
  props: {
    user: { type: Object, required: false },
    amount: { type: String, required: true },
    memo: { type: String, required: true, default: '' },
    isContributionLink: { type: Boolean, default: false },
  },
  data() {
    return {
      CONFIG,
    }
  },
}
</script>
