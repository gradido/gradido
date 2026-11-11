<template>
  <div class="redeem-information">
    <!-- A contribution link: the member's links come as a thank-you (RedeemThanks). -->
    <BCard bg-variant="muted" text-variant="dark" border-variant="info">
      <h1 v-if="linkData.amount === ''">{{ $t('gdd_per_link.redeemlink-error') }}</h1>
      <h1 v-else>
        {{ CONFIG.COMMUNITY_NAME }}
        {{ $t('contribution-link.thanksYouWith') }} {{ $filters.GDD(linkData.amount) }}
      </h1>
      <b>{{ linkData.memo }}</b>
    </BCard>
  </div>
</template>
<script setup>
import CONFIG from '@/config'

defineProps({
  linkData: { type: Object, required: true },
})
</script>
