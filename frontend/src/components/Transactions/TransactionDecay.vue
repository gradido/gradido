<template>
  <div class="transaction-slot-decay" @click="visible = !visible">
    <BRow class="text-color-gdd-yellow align-items-center">
      <BCol cols="1">
        <variant-icon icon="droplet-half" variant="gold" />
      </BCol>
      <BCol>
        {{ $t('decay.decay_since_last_transaction') }}
      </BCol>
      <BCol cols="12" md="1" lg="1" class="text-end">
        <collapse-icon class="text-end" :visible="visible" />
      </BCol>
    </BRow>

    <BCollapse class="pb-4 pt-5" :model-value="visible">
      <decay-information-decay
        :balance="balance"
        :decay="decay.decay"
        :previous-balance="previousBalance"
      />
    </BCollapse>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import DecayInformationDecay from '../DecayInformations/DecayInformation-Decay'

export default {
  name: 'TransactionDecay',
  components: {
    CollapseIcon,
    // TypeIcon,
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
  data() {
    return {
      visible: false,
    }
  },
  computed: {
    previousBalance() {
      return String(Number(this.balance) - Number(this.decay.decay))
    },
  },
}
</script>

<style scoped lang="scss">
:deep(.collapse.show) {
  padding-top: 3rem;
  padding-bottom: 1.5rem;
}

:deep(.col-1 > svg.icon-variant) {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
