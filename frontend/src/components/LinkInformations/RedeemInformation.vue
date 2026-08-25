<template>
  <div class="redeem-information">
    <BCard bg-variant="muted" text-variant="dark" border-variant="info">
      <h1 v-if="linkData.amount === ''">{{ $t('gdd_per_link.redeemlink-error') }}</h1>
      <h1 v-if="isContributionLink && linkData.amount !== ''">
        {{ CONFIG.COMMUNITY_NAME }}
        {{ $t('contribution-link.thanksYouWith') }} {{ $filters.GDD(linkData.amount) }}
      </h1>
      <!-- The sender under their alias; without one the full gradidoID (NU-018). This
           page is the one place an unauthenticated visitor sees a sender at all. -->
      <h3 v-if="isRedeemJwtLink && linkData.amount !== ''">
        {{ '"' + linkData.senderCommunity.name + '.' + senderName + '"' }}
        {{ $t('transaction-link.send_you') }} {{ $filters.GDD(linkData.amount) }}
      </h3>
      <h3 v-if="!isRedeemJwtLink && !isContributionLink && linkData.amount !== ''">
        {{ '"' + senderName + '"' }}
        {{ $t('transaction-link.send_you') }} {{ $filters.GDD(linkData.amount) }}
      </h3>
      <b>{{ linkData.memo }}</b>
    </BCard>
  </div>
</template>
<script>
import CONFIG from '@/config'
import { memberAlias } from '@/utils/memberName'

export default {
  name: 'RedeemInformation',
  props: {
    linkData: { type: Object, required: true },
    isContributionLink: { type: Boolean, default: false },
    isRedeemJwtLink: { type: Boolean, default: false },
  },
  data() {
    return {
      CONFIG,
    }
  },
  computed: {
    senderName() {
      return memberAlias(this.linkData.senderUser)
    },
  },
}
</script>
