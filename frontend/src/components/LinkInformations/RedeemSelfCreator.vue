<template>
  <div class="redeem-self-creator">
    <redeem-information v-bind="linkData" :is-contribution-link="isContributionLink" />

    <BCard>
      <div class="mb-3 text-center">
        <div class="mt-3">
          {{ $t('gdd_per_link.no-redeem') }}
          <BLink to="/transactions">
            <b>{{ $t('gdd_per_link.link-overview') }}</b>
          </BLink>
        </div>
      </div>
    </BCard>
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
