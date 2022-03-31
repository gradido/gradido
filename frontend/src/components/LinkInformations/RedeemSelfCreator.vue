<template>
  <div class="redeem-self-creator">
    <redeem-information :firstName="user.firstName" :amount="amount" :memo="memo" />

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
import RedeemInformation from '@/components/LinkInformations/RedeemInformation.vue'

export default {
  name: 'RedeemSelfCreator',
  components: {
    RedeemInformation,
  },
  props: {
    user: { type: Object, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true, default: '' },
  },
}
</script>
