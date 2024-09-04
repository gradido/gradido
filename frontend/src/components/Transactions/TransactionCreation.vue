<template>
  <div class="transaction-slot-creation" @click="visible = !visible">
    <BRow class="align-items-center">
      <BCol cols="3" lg="2" md="2">
        <BAvatar :size="42" rounded="lg" variant="success">
          <variant-icon icon="gift" variant="white" />
        </BAvatar>
      </BCol>
      <BCol>
        <div class="fw-bold">{{ linkedUser.firstName }} {{ linkedUser.lastName }}</div>
        <span class="small">{{ $d(new Date(balanceDate), 'short') }}</span>
        <span class="ms-4 small">{{ $d(new Date(balanceDate), 'time') }}</span>
      </BCol>
      <BCol cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
        <div class="small mb-2">{{ $t('decay.types.receive') }}</div>
        <div class="fw-bold">{{ $filters.GDD(amount) }}</div>
      </BCol>
      <BCol cols="12" md="1" lg="1" class="text-end">
        <collapse-icon class="text-end" :visible="visible" />
      </BCol>
    </BRow>
    <BCollapse :model-value="visible" class="pb-4 pt-lg-3">
      <decay-information
        :type-id="typeId"
        :decay="decay"
        :amount="amount"
        :memo="memo"
        :balance="balance"
        :previous-balance="previousBalance"
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

<style lang="scss" scoped>
:deep(.b-avatar-custom > svg) {
  height: 2em;
  width: 2em;
}
</style>
