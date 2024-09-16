<template>
  <div class="decay-information-box">
    <decay-information-before-startblock v-if="decay.start === null" :memo="memo" />
    <decay-information-decay-startblock
      v-else-if="isStartBlock"
      :amount="amount"
      :decay="decay"
      :type-id="typeId"
    />
    <decay-information-long
      v-else
      :amount="amount"
      :decay="decay"
      :type-id="typeId"
      :memo="memo"
      :balance="balance"
      :previous-balance="previousBalance"
    />
  </div>
</template>
<script>
import DecayInformationLong from '../DecayInformations/DecayInformation-Long'
import DecayInformationBeforeStartblock from '../DecayInformations/DecayInformation-BeforeStartblock'
import DecayInformationDecayStartblock from '../DecayInformations/DecayInformation-DecayStartblock'
import CONFIG from '@/config'

export default {
  components: {
    DecayInformationLong,
    DecayInformationBeforeStartblock,
    DecayInformationDecayStartblock,
  },
  props: {
    amount: {
      type: String,
      required: true,
    },
    decay: {
      type: Object,
      required: true,
    },
    memo: {
      type: String,
      required: true,
    },
    typeId: {
      type: String,
      required: true,
    },
    balance: {
      type: String,
      required: true,
    },
    previousBalance: {
      type: String,
      required: true,
    },
  },
  computed: {
    isStartBlock() {
      return new Date(this.decay.start).getTime() === CONFIG.DECAY_START_TIME.getTime()
    },
  },
}
</script>
