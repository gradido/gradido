<template>
  <div class="transaction-slot-decay">
    <b-row @click="visible = !visible" class="text-color-gdd-yellow align-items-center">
      <b-col cols="1"><type-icon color="text-color-gdd-yellow" icon="droplet-half" /></b-col>
      <b-col>
        {{ $t('decay.decay_since_last_transaction') }}
      </b-col>
      <b-col cols="12" md="1" lg="1" class="text-right">
        <collapse-icon class="text-right" :visible="visible" />
      </b-col>
    </b-row>

    <b-collapse class="pb-4 pt-5" v-model="visible">
      <decay-information-decay
        :balance="balance"
        :decay="decay.decay"
        :previousBalance="previousBalance"
      />
    </b-collapse>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import TypeIcon from '../TransactionRows/TypeIcon'
import DecayInformationDecay from '../DecayInformations/DecayInformation-Decay'

export default {
  name: 'TransactionDecay',
  components: {
    CollapseIcon,
    TypeIcon,
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
  computed: {
    previousBalance() {
      return String(Number(this.balance) - Number(this.decay.decay))
    },
  },
  data() {
    return {
      visible: false,
    }
  },
}
</script>
