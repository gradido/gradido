<template>
  <div class="transaction-slot-decay">
    <div @click="visible = !visible">
      <!-- Collaps Icon  -->
      <collapse-icon class="text-right" :visible="visible" />
      <div>
        <b-row>
          <!-- ICON  -->
          <b-col cols="1">
            <type-icon color="gradido-global-color-gray" icon="droplet-half" />
          </b-col>

          <b-col cols="11">
            <!-- Amount / Name || Text -->
            <amount-and-name :amount="amount" :text="$t('decay.decay_since_last_transaction')" />
          </b-col>
        </b-row>
      </div>

      <b-collapse :class="visible ? 'bg-secondary' : ''" class="pb-4 pt-5" v-model="visible">
        <decay-information-decay :balance="balance" :decay="decay" />
      </b-collapse>
    </div>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import TypeIcon from '../TransactionRows/TypeIcon'
import AmountAndName from '../TransactionRows/AmountAndName.vue'
import DecayInformationDecay from '../DecayInformations/DecayInformation-Decay'

export default {
  name: 'slot-decay',
  components: {
    CollapseIcon,
    TypeIcon,
    AmountAndName,
    DecayInformationDecay,
  },
  props: {
    amount: {
      type: String,
    },
    balance: {
      type: String,
    },
    decay: {
      type: Object,
    },
  },
  data() {
    return {
      visible: false,
    }
  },
}
</script>
