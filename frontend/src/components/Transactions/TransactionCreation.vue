<template>
  <div class="transaction-slot-creation">
    <b-row @click="visible = !visible" class="">
      <b-col cols="2">
        <b-avatar icon="gift" variant="success" size="3em"></b-avatar>
      </b-col>
      <b-col>
        <div>{{ linkedUser.firstName }} {{ linkedUser.lastName }}</div>
        <div class="small">{{ this.$d(new Date(balanceDate), 'short') }}</div>
        <div class="small">{{ this.$d(new Date(balanceDate), 'time') }}</div>
      </b-col>
      <b-col cols="3">
        <div class="small">{{ $t('decay.types.receive') }}</div>
        <div class="font-weight-bold">{{ amount | GDD }}</div>
      </b-col>
      <b-col cols="1"><collapse-icon class="text-right" :visible="visible" /></b-col>
    </b-row>
    <b-collapse class="pb-4 pt-5" v-model="visible">
      <decay-information :typeId="typeId" :decay="decay" :amount="amount" />
    </b-collapse>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
// import TypeIcon from '../TransactionRows/TypeIcon'
// import AmountAndNameRow from '../TransactionRows/AmountAndNameRow'
// import MemoRow from '../TransactionRows/MemoRow'
// import DateRow from '../TransactionRows/DateRow'
// import DecayRow from '../TransactionRows/DecayRow'
import DecayInformation from '../DecayInformations/DecayInformation'

export default {
  name: 'TransactionCreation',
  components: {
    CollapseIcon,
    // TypeIcon,
    // AmountAndNameRow,
    // MemoRow,
    // DateRow,
    // DecayRow,
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
