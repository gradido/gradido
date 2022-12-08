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
            <amount-and-name-row
              v-on="$listeners"
              :amount="amount"
              :linkedUser="linkedUser"
              :linkId="linkId"
            />

            <!-- Nachricht Memo -->
            <memo-row :memo="memo" />

            <!-- Datum -->
            <date-row :date="balanceDate" />

            <!-- Decay -->
            <decay-row :decay="decay.decay" />
          </b-col>
        </b-row>
      </div>

      <b-collapse :class="visible ? 'bg-secondary' : ''" class="pb-4 pt-5" v-model="visible">
        <decay-information :typeId="typeId" :decay="decay" :amount="amount" />
      </b-collapse>
    </div>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import TypeIcon from '../TransactionRows/TypeIcon'
import AmountAndNameRow from '../TransactionRows/AmountAndNameRow'
import MemoRow from '../TransactionRows/MemoRow'
import DateRow from '../TransactionRows/DateRow'
import DecayRow from '../TransactionRows/DecayRow'
import DecayInformation from '../DecayInformations/DecayInformation'

export default {
  name: 'TransactionReceive',
  components: {
    CollapseIcon,
    TypeIcon,
    AmountAndNameRow,
    MemoRow,
    DateRow,
    DecayRow,
    DecayInformation,
  },
  props: {
    amount: {
      type: String,
      required: true,
    },
    balanceDate: {
      type: String,
      required: true,
    },
    decay: {
      type: Object,
      required: true,
    },
    linkedUser: {
      type: Object,
      required: true,
    },
    memo: {
      type: String,
      required: true,
    },
    typeId: {
      type: String,
    },
    linkId: {
      type: Number,
      required: false,
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
