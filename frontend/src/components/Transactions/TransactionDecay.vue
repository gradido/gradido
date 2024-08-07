<template>
  <div @click="visible = !visible" class="transaction-slot-decay">
    <BRow class="text-color-gdd-yellow align-items-center">
      <BCol cols="1">
        <!--        <type-icon color="text-color-gdd-yellow" icon="droplet-half" />-->
        <IBiDropletHalf />
      </BCol>
      <BCol>
        {{ $t('decay.decay_since_last_transaction') }}
      </BCol>
      <BCol cols="12" md="1" lg="1" class="text-right">
        <collapse-icon class="text-right" :visible="visible" />
      </BCol>
    </BRow>

    <BCollapse class="pb-4 pt-5" :model-value="visible">
      <decay-information-decay
        :balance="balance"
        :decay="decay.decay"
        :previousBalance="previousBalance"
      />
    </BCollapse>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import TypeIcon from '../TransactionRows/TypeIcon'
import DecayInformationDecay from '../DecayInformations/DecayInformation-Decay'

export default {
  name: 'TransactionDecay',
  components: {
    CollapseIcon,
    TypeIcon,
    DecayInformationDecay,
  },
  props: {
    amount: {
      type: String,
      required: true,
    },
    balance: {
      type: String,
      required: true,
    },
    decay: {
      type: Object,
      required: true,
    },
  },
  computed: {
    previousBalance() {
      return String(Number(this.balance) - Number(this.decay.decay))
    },
  },
  data() {
    return {
      visible: false,
    }
  },
}
</script>
