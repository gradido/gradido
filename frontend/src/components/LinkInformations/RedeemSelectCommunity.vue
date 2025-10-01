<template>
  <div class="redeem-select-community">
    <BCard v-if="props.isTransactionLinkLoaded">
      <redeem-community-selection
        v-model:recipient-community="recipientCommunity"
        :link-data="props.linkData"
        :redeem-code="props.redeemCode"
        :is-transaction-link-loaded="props.isTransactionLinkLoaded"
        :is-contribution-link="props.isContributionLink"
        :is-redeem-jwt-link="props.isRedeemJwtLink"
      />
      <div v-if="!isForeignCommunitySelected">
        <h2>{{ $t('gdd_per_link.redeem-community') }} {{ recipientCommunity.name }}</h2>
        <BRow>
          <BCol sm="12" md="6">
            <p>{{ $t('gdd_per_link.no-account') }}</p>
            <BButton variant="primary" :to="routeWithParamsAndQuery('Register')">
              {{ $t('gdd_per_link.to-register') }}
            </BButton>
          </BCol>
          <BCol sm="12" md="6" class="mt-4 mt-lg-0">
            <p>{{ $t('gdd_per_link.has-account') }}</p>
            <BButton variant="gradido" :to="routeWithParamsAndQuery('Login')">
              {{ $t('gdd_per_link.to-login') }}
            </BButton>
          </BCol>
        </BRow>
      </div>
    </BCard>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CONFIG from '@/config'
import { useAuthLinks } from '@/composables/useAuthLinks'

const { routeWithParamsAndQuery } = useAuthLinks()
const props = defineProps({
  linkData: { type: Object, required: true },
  redeemCode: { type: String, required: true },
  isContributionLink: { type: Boolean, default: false },
  isRedeemJwtLink: { type: Boolean, default: false },
  isTransactionLinkLoaded: { type: Boolean, default: false },
})

const recipientCommunity = ref({
  uuid: '',
  name: CONFIG.COMMUNITY_NAME,
  url: CONFIG.COMMUNITY_URL,
  foreign: false,
})

const isForeignCommunitySelected = computed(() => {
  return recipientCommunity.value.foreign === true
})
</script>
