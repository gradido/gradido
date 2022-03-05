<template>
  <div :class="visible ? 'bg-secondary' : ''" class="transaction-slot-decay">
    <div @click="visible = !visible">
      <!-- Collaps Icon  -->
      <div class="text-right" style="width: 95%; position: absolute">
        <b-icon
          :icon="visible ? 'caret-up-square' : 'caret-down-square'"
          :class="visible ? 'text-black' : 'text-muted'"
        />
      </div>

      <div>
        <b-row>
          <!-- ICON  -->
          <b-col cols="1">
            <div class="gdd-transaction-list-item-icon">
              <b-icon icon="droplet-half" class="gradido-global-color-gray m-mb-1 font2em" />
            </div>
          </b-col>

          <b-col cols="11">
            <!-- Betrag / Name Email -->
            <b-row>
              <b-col cols="5">
                <div class="text-right">
                  <span class="gdd-transaction-list-item-amount">
                    {{ $n(amount, 'decimal') }}
                  </span>
                </div>
              </b-col>
              <b-col cols="7">
                <div class="gdd-transaction-list-item-name">
                  {{
                    typeId !== 'DECAY'
                      ? linkedUser.firstName + ' ' + linkedUser.lastName
                      : $t('decay.decay_since_last_transaction')
                  }}
                </div>
              </b-col>
            </b-row>
          </b-col>
        </b-row>
      </div>

      <b-collapse class="pb-4 pt-5" v-model="visible">
        <!--<decay-information-decay :balance="balance" :decay="decay" />-->
      </b-collapse>
    </div>
  </div>
</template>
<script>
// import DecayInformationDecay from '../DecayInformations/DecayInformation-Decay'

export default {
  name: 'slot-decay',
  /*
  components: {
    DecayInformationDecay,
  },
  */
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
  },
  data() {
    return {
      visible: false,
    }
  },
}
</script>
