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
            <date :balanceDate="balanceDate" />

            <!-- Decay -->
            <b-row v-if="decay">
              <b-col cols="5">
                <div class="text-right">
                  <b-icon icon="droplet-half" height="15" class="mb-1" />
                </div>
              </b-col>
              <b-col cols="7">
                <div class="gdd-transaction-list-item-decay">
                  <decay-information-short decaytyp="short" :decay="decay" />
                </div>
              </b-col>
            </b-row>
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
import AmountAndName from '../TransactionRows/AmountAndName.vue'
import Memo from '../TransactionRows/Memo.vue'
import Date from '../TransactionRows/Date.vue'
import DecayInformationShort from '../DecayInformations/DecayInformation-Short'
import DecayInformationLong from '../DecayInformations/DecayInformation-Long'
import DecayInformationBeforeStartblock from '../DecayInformations/DecayInformation-BeforeStartblock'
import DecayInformationDecayStartblock from '../DecayInformations/DecayInformation-DecayStartblock'

export default {
  name: 'slot-creation',
  components: {
    CollapseIcon,
    TypeIcon,
    AmountAndName,
    Memo,
    Date,
    DecayInformationShort,
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
