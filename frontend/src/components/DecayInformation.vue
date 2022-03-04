<template>
  <div class="decayinformation">
    <span v-if="decaytyp === 'short'">
      {{ decay ? $n(decay.decay, 'decimal') : '' }}
    </span>

    <div v-if="decaytyp === 'new' || decaytyp === 'decayLastTransaction'">
      <!-- if decay.start === null - Wenn kein decay angegeben dan ist es die erste Transaktion -->
      <div v-if="decay.start === null" class="mt-3 mb-3 text-center">
        <b>{{ $t('decay.first_transaction') }}</b>
      </div>

      <!-- if balanceDate <  decayStartBlock - Wenn die transaktion vor dem einführen der dacay function liegt. -->
      <div
        v-else-if="new Date(balanceDate).getTime() < new Date(decayStartBlock).getTime()"
        class="mt-3 mb-3 text-center"
      >
        <b>{{ $t('decay.before_startblock_transaction') }}</b>
      </div>

      <div v-else>
        <div class="d-flex">
          <div style="width: 100%" class="text-center pb-3">
            <b-icon icon="droplet-half" height="12" class="mb-2" />
            <b>{{ $t('decay.calculation_decay') }}</b>
          </div>
        </div>

        <b-row>
          <b-col cols="6" class="text-right">
            <!-- <div v-if="!decay.decayStartBlock">{{ $t('decay.last_transaction') }}</div> -->
            <div>{{ $t('decay.last_transaction') }}</div>
          </b-col>
          <b-col cols="6">
            <div>
              <span v-if="decay.start">
                {{ $d(new Date(decay.start), 'long') }}
                {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
              </span>
            </div>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6" class="text-right">
            <!-- <div v-if="!decay.decayStartBlock">{{ $t('decay.past_time') }}</div> -->
            <div>{{ $t('decay.past_time') }}</div>
          </b-col>
          <b-col cols="6">
            <span v-if="duration">
              <span v-if="duration.years > 0">{{ duration.years }} {{ $t('decay.year') }},</span>
              <span v-if="duration.months > 0">
                {{ duration.months }} {{ $t('decay.months') }},
              </span>
              <span v-if="duration.days > 0">{{ duration.days }} {{ $t('decay.days') }},</span>
              <span v-if="duration.hours > 0">{{ duration.hours }} {{ $t('decay.hours') }},</span>
              <span v-if="duration.minutes > 0">
                {{ duration.minutes }} {{ $t('decay.minutes') }},
              </span>
              <span v-if="duration.seconds > 0">
                {{ duration.seconds }} {{ $t('decay.seconds') }}
              </span>
            </span>
          </b-col>
        </b-row>

        <!-- Decay-->
        <b-row>
          <b-col cols="6" class="text-right">
            <div>{{ $t('decay.decay') }}</div>
          </b-col>
          <b-col cols="6">
            <div v-if="decaytyp === 'new'">- {{ $n(decay.decay, 'decimal') }}</div>
            <div v-if="decaytyp === 'decayLastTransaction'">
              {{ $n(decay.decay + amount, 'decimal') }} GDD - {{ $n(decay.decay, 'decimal') }} GDD =
              <b>{{ $n(amount, 'decimal') }} GDD</b>
            </div>
          </b-col>
        </b-row>
        <hr class="mt-2 mb-2" />
        <b-row v-if="decaytyp === 'new'">
          <b-col class="text-center pt-3 pb-2">
            <b>{{ $t('decay.calculation_total') }}</b>
          </b-col>
        </b-row>
        <!-- Type-->
        <b-row v-if="decaytyp === 'new'">
          <b-col cols="6" class="text-right">
            <div v-if="typeId === 'SEND'">{{ $t('decay.sent') }}</div>
            <div v-if="typeId === 'RECEIVE'">{{ $t('decay.received') }}</div>
          </b-col>
          <b-col cols="6">
            <div v-if="typeId === 'SEND'">{{ $n(amount, 'decimal') }}</div>
            <div v-if="typeId === 'RECEIVE'">{{ $n(amount, 'decimal') }}</div>
          </b-col>
        </b-row>
        <!-- Decay-->
        <b-row v-if="decaytyp === 'new'">
          <b-col cols="6" class="text-right">
            <div>{{ $t('decay.decay') }}</div>
          </b-col>
          <b-col cols="6">
            <div>{{ $n(decay.decay, 'decimal') }}</div>
          </b-col>
        </b-row>
        <!-- Total-->
        <b-row v-if="decaytyp === 'new'">
          <b-col cols="6" class="text-right">
            <div>{{ $t('decay.total') }}</div>
          </b-col>
          <b-col cols="6">
            <div v-if="typeId === 'SEND'">
              <b>{{ $n(amount + decay.decay, 'decimal') }}</b>
            </div>
            <div v-if="typeId === 'RECEIVE'">
              <b>{{ $n(amount - decay.decay, 'decimal') }}</b>
            </div>
            <div v-if="typeId === 'CREATION'">
              <b>{{ $n(amount - decay.decay, 'decimal') }}</b>
            </div>
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation',
  props: {
    amount: { type: String, default: '0' },
    typeId: { type: String, default: '' },
    balanceDate: { type: String },
    decayStartBlock: { type: String },
    decay: {
      decay: '',
      start: 0,
      end: 0,
      duration: '',
    },
    decaytyp: { type: String, default: '' },
  },
  computed: {
    duration() {
      return this.$moment.duration(this.decay.end - this.decay.start)._data
    },
  },
}
</script>
