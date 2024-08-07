<template>
  <div class="transaction-slot-creation">
    <BRow @click="visible = !visible" class="align-items-center">
      <BCol cols="3" lg="2" md="2">
        <b-avatar icon="gift" variant="success" :size="42"></b-avatar>
      </BCol>
      <BCol>
        <div class="font-weight-bold">{{ linkedUser.firstName }} {{ linkedUser.lastName }}</div>
        <span class="small">{{ this.$d(new Date(balanceDate), 'short') }}</span>
        <span class="ml-4 small">{{ this.$d(new Date(balanceDate), 'time') }}</span>
      </BCol>
      <BCol cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
        <div class="small mb-2">{{ $t('decay.types.receive') }}</div>
        <div class="font-weight-bold">{{ $filters.GDD(amount) }}</div>
      </BCol>
      <BCol cols="12" md="1" lg="1" class="text-right">
        <collapse-icon class="text-right" :visible="visible" />
      </BCol>
    </BRow>
    <BCollapse class="pb-4 pt-lg-3" v-model="visible">
      <decay-information
        :typeId="typeId"
        :decay="decay"
        :amount="amount"
        :memo="memo"
        :balance="balance"
        :previousBalance="previousBalance"
      />
    </BCollapse>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import DecayInformation from '../DecayInformations/DecayInformation'

export default {
  name: 'TransactionCreation',
  components: {
    CollapseIcon,
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
    balance: {
      type: String,
      required: true,
    },
    previousBalance: {
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
