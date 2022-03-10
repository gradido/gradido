<template>
  <div class="transaction-slot-receive">
    <div @click="visible = !visible">
      <!-- Collaps Icon  -->
      <collapse-icon class="text-right" :visible="visible" />

      <div>
        <b-row>
          <!-- ICON  -->
          <b-col cols="1">
            <type-icon color="gradido-global-color-accent" icon="arrow-right-circle" />
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
        <decay-information-before-startblock v-if="decay.start === null" />
        <decay-information-decay-startblock
          v-else-if="isStartBlock"
          :amount="amount"
          :decay="decay"
          :typeId="typeId"
        />
        <decay-information-long v-else :amount="amount" :decay="decay" :typeId="typeId" />
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
import DecayInformationLong from '../DecayInformations/DecayInformation-Long'
import DecayInformationBeforeStartblock from '../DecayInformations/DecayInformation-BeforeStartblock'
import DecayInformationDecayStartblock from '../DecayInformations/DecayInformation-DecayStartblock'

export default {
  name: 'slot-receive',
  components: {
    CollapseIcon,
    TypeIcon,
    AmountAndName,
    Memo,
    DateRow,
    DecayRow,
    DecayInformationLong,
    DecayInformationBeforeStartblock,
    DecayInformationDecayStartblock,
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
