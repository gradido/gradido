<template>
  <div class="redeem-information">
    <BCard bg-variant="muted" text-variant="dark" border-variant="info">
      <h1 v-if="amount === ''">{{ $t('gdd_per_link.redeemlink-error') }}</h1>
      <h1 v-if="isContributionLink && amount !== ''">
        {{ CONFIG.COMMUNITY_NAME }}
        {{ $t('contribution-link.thanksYouWith') }} {{ $filters.GDD(amount) }}
      </h1>
      <h1 v-if="!isContributionLink && amount !== ''">
        {{ user.firstName }}
        {{ $t('transaction-link.send_you') }} {{ $filters.GDD(amount) }}
      </h1>
      <b>{{ memo }}</b>
    </BCard>
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
