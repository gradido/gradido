<template>
  <div class="redeem-logged-out">
    <redeem-information :link-data="linkData" :is-contribution-link="isContributionLink" />

    <BCard>
      <div class="mb-2">
        <h2>{{ $t('gdd_per_link.redeem') }}</h2>
      </div>

      <BRow>
        <BCol sm="12" md="6">
          <p>{{ $t('gdd_per_link.no-account') }}</p>
          <BButton variant="primary" :to="routeWithParamsAndQuery('Register')">
            {{ $t('gdd_per_link.to-register') }}
          </BButton>
        </BCol>
        <BCol sm="12" md="6" class="mt-4 mt-lg-0">
          <p>{{ $t('gdd_per_link.has-account') }}</p>
          <BButton variant="gradido" :to="routeWithParamsAndQuery('Login')">{{ $t('gdd_per_link.to-login') }}</BButton>
        </BCol>
      </BRow>
    </BCard>
  </div>
</template>

<script setup>
import { useAuthLinks } from '@/composables/useAuthLinks'

const { routeWithParamsAndQuery } = useAuthLinks()
defineProps({
  linkData: { type: Object, required: true },
  isContributionLink: { type: Boolean, default: false },
})
</script>
