<template>
  <div class="redeem-valid">
    <redeem-information :firstName="user.firstName" :amount="amount" :memo="memo" />
    <b-jumbotron>
      <div class="mb-3 text-center">
        <b-button variant="primary" @click="$emit('redeem-link', amount)" size="lg">
          {{ $t('gdd_per_link.redeem') }}
        </b-button>
      </div>
    </b-jumbotron>
  </div>
</template>
<script>
import RedeemInformation from '@/components/LinkInformations/RedeemInformation.vue'

export default {
  name: 'RedeemValid',
  components: {
    RedeemInformation,
  },
  props: {
    user: { type: Object, required: false },
    amount: { type: String, required: false },
    memo: { type: String, required: false, default: '' },
  },
}
</script>
