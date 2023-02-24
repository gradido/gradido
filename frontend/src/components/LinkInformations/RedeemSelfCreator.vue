<template>
  <div class="redeem-self-creator">
    <redeem-information v-bind="linkData" :isContributionLink="isContributionLink" />

    <b-jumbotron>
      <div class="mb-3 text-center">
        <div class="mt-3">
          {{ $t('gdd_per_link.no-redeem') }}
          <b-link to="/transactions">
            <b>{{ $t('gdd_per_link.link-overview') }}</b>
          </b-link>
        </div>
      </div>
    </b-jumbotron>
  </div>
</template>
<script>
import RedeemInformation from '@/components/LinkInformations/RedeemInformation'

export default {
  name: 'RedeemSelfCreator',
  components: {
    RedeemInformation,
  },
  props: {
    linkData: { type: Object, required: true },
    isContributionLink: { type: Boolean, default: false },
  },
}
</script>
