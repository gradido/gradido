<template>
  <div>
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
              <b-icon :icon="properties.icon" :class="properties.class" />
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
        <div class="d-flex">
          <div style="width: 100%" class="text-center pb-3">
            <b-icon icon="droplet-half" height="12" class="mb-2" />
            <b>{{ $t('decay.calculation_decay') }}</b>
          </div>
        </div>

        <b-row>
          <b-col cols="6" class="text-right">
            <div>{{ $t('decay.decay') }}</div>
          </b-col>
          <b-col cols="6">
            <div>
              {{ Number(balance) + Number(decay.decay) * -1 }} :::: {{ Number(decay.decay) }} :::::
              {{ $n(Number(balance) + Number(decay.decay) * -1, 'decimal') }}
              GDD - {{ $n(Number(decay.decay) * -1, 'decimal') }} GDD =
              <b>{{ $n(Number(balance), 'decimal') }} GDD</b>
            </div>
          </b-col>
        </b-row>
        <hr />
        {{ amount }}, {{ balance }}, {{ balanceDate }}, {{ decay }}, {{ id }}, {{ linkedUser }},
        {{ memo }}, {{ properties }},, {{ visible }}
      </b-collapse>
    </div>
  </div>
</template>
<script>
// import DecayInformation from '../DecayInformation'

export default {
  name: 'slot-decay',
  components: {
    // DecayInformation,
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
  },
  data() {
    return {
      visible: false,
    }
  },
}
</script>
