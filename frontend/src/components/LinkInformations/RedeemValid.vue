<template>
  <div class="redeem-valid">
    <redeem-information v-bind="linkData" :isContributionLink="isContributionLink" />
    <b-jumbotron>
      <div class="mb-3 text-center">
        <b-button
          variant="gradido"
          @click="$emit('mutation-link', linkData.amount)"
          size="lg"
          :disabled="!validLink"
        >
          {{ $t('gdd_per_link.redeem') }}
        </b-button>
      </div>
    </b-jumbotron>
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
