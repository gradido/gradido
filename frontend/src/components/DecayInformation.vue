<template>
  <div class="decayinformation">
    <span v-if="decaytyp === 'short'">
      {{ decay ? ' − ' + $n(Math.abs(Number(decay.decay)), 'decimal') : '' }}
    </span>

    <div v-if="decaytyp === 'new'">
      <div class="d-flex" v-if="!decay.decayStartBlock">
        <div style="width: 100%" class="text-center pb-3">
          <b-icon icon="droplet-half" height="12" class="mb-2" />
          <b>{{ $t('decay.calculation_decay') }}</b>
        </div>
      </div>

      <b-row>
        <b-col cols="6" class="text-right">
          <div v-if="!decay.decayStartBlock">{{ $t('decay.last_transaction') }}</div>
        </b-col>
        <b-col cols="6">
          <div v-if="decay.decayStartBlock > 0">
            <div class="display-4">{{ $t('decay.Starting_block_decay') }}</div>
            <div>{{ $t('decay.decay_introduced') }} :</div>
          </div>
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
          <div v-if="!decay.decayStartBlock">{{ $t('decay.past_time') }}</div>
        </b-col>
        <b-col cols="6">
          <div v-if="decay.decayStartBlock > 0">{{ $t('decay.since_introduction') }}</div>
          <span v-if="duration">
            <span v-if="duration.years > 0">{{ duration.years }} {{ $t('decay.year') }},</span>
            <span v-if="duration.months > 0">{{ duration.months }} {{ $t('decay.months') }},</span>
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
          <div>− {{ $n(Math.abs(Number(decay.decay)), 'decimal') }}</div>
        </b-col>
      </b-row>
      <hr class="mt-2 mb-2" />
      <b-row>
        <b-col class="text-center pt-3 pb-2">
          <b>{{ $t('decay.calculation_total') }}</b>
        </b-col>
      </b-row>
      <!-- Type-->
      <b-row>
        <b-col cols="6" class="text-right">
          <div v-if="type === 'send'">{{ $t('decay.sent') }}</div>
          <div v-if="type === 'receive'">{{ $t('decay.received') }}</div>
        </b-col>
        <b-col cols="6">
          <div v-if="type === 'send'">− {{ $n(Number(balance), 'decimal') }}</div>
          <div v-if="type === 'receive'">+ {{ $n(Number(balance), 'decimal') }}</div>
        </b-col>
      </b-row>
      <!-- Decay-->
      <b-row>
        <b-col cols="6" class="text-right">
          <div>{{ $t('decay.decay') }}</div>
        </b-col>
        <b-col cols="6">
          <div>− {{ $n(Math.abs(Number(decay.decay)), 'decimal') }}</div>
        </b-col>
      </b-row>
      <!-- Total-->
      <b-row>
        <b-col cols="6" class="text-right">
          <div>{{ $t('decay.total') }}</div>
        </b-col>
        <b-col cols="6">
          <div v-if="type === 'send'">
            <b>− {{ $n(Number(balance) + Math.abs(Number(decay.decay)), 'decimal') }}</b>
          </div>
          <div v-if="type === 'receive'">
            <b>{{ $n(Number(balance) - Math.abs(Number(decay.decay)), 'decimal') }}</b>
          </div>
          <div v-if="type === 'creation'">
            <b>− {{ $n(Number(balance) - Math.abs(Number(decay.decay)), 'decimal') }}</b>
          </div>
        </b-col>
      </b-row>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation',
  props: {
    type: { type: String, default: '' },
    decay: {
      decay: '',
      duration: '',
      start: 0,
      end: 0,
    },
    decaytyp: { type: String, default: '' },
  },
  computed: {
    duration() {
      return this.$moment.duration(new Date(this.decay.end) - new Date(this.decay.start))._data
    },
  },
}
</script>
