<template>
  <div class="transaction-slot-creation">
    <div @click="visible = !visible">
      <!-- Collaps Icon  -->
      <collapse-icon class="text-right" :visible="visible" />

      <div>
        <b-row>
          <!-- ICON  -->
          <b-col cols="1">
            <type-icon color="gradido-global-color-accent" icon="gift" />
          </b-col>

          <b-col cols="11">
            <!-- Amount / Name || Text -->
            <amount-and-name :amount="amount" :linkedUser="linkedUser" />

            <!-- Nachricht Memo -->
            <memo :memo="memo" />

            <!-- Datum -->
            <date-row :balanceDate="balanceDate" />

            <!-- Decay -->
            <decay-row :decay="decay" />
          </b-col>
        </b-row>
      </div>

      <b-collapse :class="visible ? 'bg-secondary' : ''" class="pb-4 pt-5" v-model="visible">
        <decay-information
          :typeId="typeId"
          :decay="decay"
          :amount="amount"
          :decayStartBlock="decayStartBlock"
        />
      </b-collapse>
    </div>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import TypeIcon from '../TransactionRows/TypeIcon'
import AmountAndName from '../TransactionRows/AmountAndName'
import Memo from '../TransactionRows/Memo'
import DateRow from '../TransactionRows/DateRow'
import DecayRow from '../TransactionRows/DecayRow'
import DecayInformation from '../DecayInformations/DecayInformation'

export default {
  name: 'slot-creation',
  components: {
    CollapseIcon,
    TypeIcon,
    AmountAndName,
    Memo,
    DateRow,
    DecayRow,
    DecayInformation,
  },
  props: {
    amount: {
      type: String,
    },
    balance: {
      type: String,
    },
    balanceDate: {
      type: String,
    },
    decay: {
      type: Object,
    },
    id: {
      type: Number,
    },
    linkedUser: {
      type: Object,
    },
    memo: {
      type: String,
    },
    typeId: {
      type: String,
    },
    properties: {
      type: Object,
    },
    decayStartBlock: { type: Date },
  },
  data() {
    return {
      visible: false,
    }
  },
  computed: {
    isStartBlock() {
      return new Date(this.decay.start).getTime() === this.decayStartBlock.getTime()
    },
  },
}
</script>
