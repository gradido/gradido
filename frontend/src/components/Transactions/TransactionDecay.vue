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
            <amount-and-name-row
              :amount="amount"
              :text="$t('decay.decay_since_last_transaction')"
            />
          </b-col>
        </b-row>
      </div>

      <b-collapse class="pb-4 pt-5" v-model="visible">
        <decay-information-decay
          :balance="balance"
          :decay="decay.decay"
          :previousBookedBalance="previousBookedBalance"
        />
      </b-collapse>
    </div>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import TypeIcon from '../TransactionRows/TypeIcon'
import AmountAndNameRow from '../TransactionRows/AmountAndNameRow'
import DecayInformationDecay from '../DecayInformations/DecayInformation-Decay'

export default {
  name: 'TransactionDecay',
  components: {
    CollapseIcon,
    TypeIcon,
    AmountAndNameRow,
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
    previousBookedBalance: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      visible: false,
    }
  },
}
</script>
