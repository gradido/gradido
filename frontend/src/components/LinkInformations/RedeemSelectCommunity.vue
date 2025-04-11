<template>
  <div class="redeem-select-community">
    <redeem-community-selection
      v-model:target-community="yourTargetCommunity"
      :link-data="props.linkData"
      :redeem-code="props.redeemCode"
      :is-contribution-link="props.isContributionLink"
    />

    <BCard>
      <div class="mb-2">
        <h2>{{ $t('gdd_per_link.redeem') }}</h2>
      </div>

      <BRow>
        <BCol sm="12" md="6">
          <p>{{ $t('gdd_per_link.no-account') }}</p>
          <BButton variant="primary" :to="register()">
            {{ $t('gdd_per_link.to-register') }}
          </BButton>
        </BCol>
        <BCol sm="12" md="6" class="mt-4 mt-lg-0">
          <p>{{ $t('gdd_per_link.has-account') }}</p>
          <BButton variant="gradido" :to="login()">
            {{ $t('gdd_per_link.to-login') }}
          </BButton>
        </BCol>
      </BRow>
    </BCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CONFIG from '@/config'
import { useAuthLinks } from '@/composables/useAuthLinks'

const { login, register } = useAuthLinks()
const props = defineProps({
  linkData: { type: Object, required: true },
  redeemCode: { type: String, required: true },
  isContributionLink: { type: Boolean, default: false },
})

const yourTargetCommunity = ref({
  uuid: '',
  name: CONFIG.COMMUNITY_NAME,
})
</script>
