<template>
  <div class="decay-information-box">
    <decay-information-before-startblock v-if="decay.start === null" />
    <decay-information-decay-startblock
      v-else-if="isStartBlock"
      :amount="amount"
      :decay="decay"
      :typeId="typeId"
    />
    <decay-information-long v-else :amount="amount" :decay="decay" :typeId="typeId" />
  </div>
</template>
<script>
import DecayInformationLong from '../DecayInformations/DecayInformation-Long'
import DecayInformationBeforeStartblock from '../DecayInformations/DecayInformation-BeforeStartblock'
import DecayInformationDecayStartblock from '../DecayInformations/DecayInformation-DecayStartblock'

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
    typeId: {
      type: String,
      required: true,
    },
    decayStartBlock: {
      type: Date,
      required: true,
    },
  },
  computed: {
    isStartBlock() {
      return new Date(this.decay.start).getTime() === this.decayStartBlock.getTime()
    },
  },
}
</script>
