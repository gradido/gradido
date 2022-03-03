<template>
  <div :class="visible ? 'bg-secondary' : ''" class="transaction-slot-send">
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
              <b-icon icon="arrow-left-circle" class="text-danger m-mb-1 font2em" />
            </div>
          </b-col>

          <b-col cols="11">
            <!-- Betrag / Name Email -->
            <b-row>
              <b-col cols="5">
                <div class="text-right">
                  <span class="gdd-transaction-list-item-operator">-</span>
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

            <!-- Nachricht Memo -->
            <b-row>
              <b-col cols="5">
                <div class="text-right">{{ $t('form.memo') }}</div>
              </b-col>
              <b-col cols="7">
                <div class="gdd-transaction-list-message">{{ memo }}</div>
              </b-col>
            </b-row>

            <!-- Datum -->
            <b-row v-if="typeId !== 'DECAY'">
              <b-col cols="5">
                <div class="text-right">{{ $t('form.date') }}</div>
              </b-col>
              <b-col cols="7">
                <div class="gdd-transaction-list-item-date">
                  {{ $d(new Date(balanceDate), 'long') }}
                  {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
                </div>
              </b-col>
            </b-row>

            <!-- Decay -->
            <b-row v-if="decay">
              <b-col cols="5">
                <div class="text-right">
                  <b-icon v-if="typeId != 'DECAY'" icon="droplet-half" height="15" class="mb-1" />
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

      <b-collapse class="pb-4 pt-5" v-model="visible">
        <decay-information-first-transaction v-if="decay.start === null" :decay="decay" />
        <decay-information-long v-else :amount="amount" :decay="decay" :typeId="typeId" />
      </b-collapse>
    </div>
  </div>
</template>
<script>
import DecayInformationShort from '../DecayInformations/DecayInformation-Short'
import DecayInformationLong from '../DecayInformations/DecayInformation-Long'
import DecayInformationFirstTransaction from '../DecayInformations/DecayInformation-FirstTransaction'
export default {
  name: 'slot-send',
  components: {
    DecayInformationShort,
    DecayInformationLong,
    DecayInformationFirstTransaction,
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
    decayStartBlock: { type: Date },
  },
  data() {
    return {
      visible: false,
    }
  },
}
</script>
