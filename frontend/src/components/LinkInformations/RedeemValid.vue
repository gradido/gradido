<template>
  <div class="redeem-valid">
    <redeem-information v-bind="linkData" :is-contribution-link="isContributionLink" />
    <BCard>
      <div class="mb-3 text-center">
        <BButton
          variant="gradido"
          size="lg"
          :disabled="!validLink"
          @click="$emit('mutation-link', linkData.amount)"
        >
          {{ $t('gdd_per_link.redeem') }}
        </BButton>
      </div>
    </BCard>
  </div>
</template>
<script>
import RedeemInformation from '@/components/LinkInformations/RedeemInformation'

export default {
  name: 'RedeemValid',
  components: {
    RedeemInformation,
  },
  props: {
    linkData: { type: Object, required: true },
    isContributionLink: { type: Boolean, default: false },
    validLink: { type: Boolean, default: false },
  },
}
</script>
