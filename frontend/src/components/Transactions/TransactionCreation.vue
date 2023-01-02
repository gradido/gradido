<template>
  <div class="transaction-slot-creation">
    <b-row @click="visible = !visible" class="align-items-center">
      <b-col cols="3" lg="2" md="2">
        <b-avatar icon="gift" variant="success" :size="42"></b-avatar>
      </b-col>
      <b-col>
        <div class="font-weight-bold">{{ linkedUser.firstName }} {{ linkedUser.lastName }}</div>
        <span class="small">{{ this.$d(new Date(balanceDate), 'short') }}</span>
        <span class="ml-4 small">{{ this.$d(new Date(balanceDate), 'time') }}</span>
      </b-col>
      <b-col cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
        <div class="small">{{ $t('decay.types.receive') }}</div>
        <div class="font-weight-bold">{{ amount | GDD }}</div>
      </b-col>
      <b-col cols="12" md="1" lg="1" class="text-right">
        <collapse-icon class="text-right" :visible="visible" />
      </b-col>
    </b-row>
    <b-collapse class="pb-4 pt-lg-3" v-model="visible">
      <div class="word-break mb-4 mt-lg-3 offset-2">
        <div class="font-weight-bold pb-2">{{ $t('form.memo') }}</div>
        {{ memo }}
      </div>
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
