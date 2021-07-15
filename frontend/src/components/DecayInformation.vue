<template>
  <div>
    <span v-if="decaytyp === 'short'">
      <small>{{ decay ? ' -' + decay.balance + ' ' + decayStartBlockTextShort : '' }}</small>
    </span>

    <div v-if="decaytyp === 'new'">
      <b-list-group style="border: 0px">
        <b-list-group-item style="border: 0px; background-color: #f1f1f1">
          <div class="d-flex">
            <div style="width: 40%" class="text-right pr-3 mr-2">
              {{ $t('decay.calculation_decay') }}
              <b-icon icon="droplet-half" height="12" class="mb-2" />
            </div>
            <div style="width: 60%"></div>
          </div>

          <div class="d-flex">
            <div style="width: 40%" class="text-right pr-3 mr-2">
              {{ $t('decay.last_transaction') }}
            </div>
            <div style="width: 60%">
              <div v-if="decay.decay_start_block > 0">
                <div class="display-4">{{ $t('decay.Starting_block_decay') }}</div>
                <div>
                  {{ $t('decay.decay_introduced') }} :
                  {{ $d($moment.unix(decay.decay_start), 'long') }}
                </div>
              </div>
              <div>
                <span>
                  {{ $d($moment.unix(decay.decay_start), 'long') }}
                  {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
                </span>
              </div>
            </div>
          </div>

          <div class="d-flex">
            <div style="width: 40%" class="text-right pr-3 mr-2">
              {{ $t('decay.past_time') }}
            </div>
            <div style="width: 60%">
              <div v-if="decay.decay_start_block > 0">{{ $t('decay.since_introduction') }}</div>
              <span v-if="duration">
                <b v-if="duration.years > 0">{{ duration.years }} {{ $t('decay.year') }},</b>
                <b v-if="duration.months > 0">{{ duration.months }} {{ $t('decay.months') }},</b>
                <b v-if="duration.days > 0">{{ duration.days }} {{ $t('decay.days') }},</b>
                <b v-if="duration.hours > 0">{{ duration.hours }} {{ $t('decay.hours') }},</b>
                <b v-if="duration.minutes > 0">{{ duration.minutes }} {{ $t('decay.minutes') }},</b>
                <b v-if="duration.seconds > 0">{{ duration.seconds }} {{ $t('decay.seconds') }}</b>
              </span>
            </div>
          </div>
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation',
  props: {
    decay: {
      balance: '',
      decay_duration: '',
      decay_start: 0,
      decay_end: 0,
      decay_start_block: 0,
    },
    decaytyp: { type: String, default: '' },
  },
  computed: {
    decayStartBlockTextShort() {
      return this.decay.decay_start_block
        ? ' - Startblock Decay am: ' + this.$d(this.$moment.unix(this.decay.decay_start_block))
        : ''
    },
    duration() {
      return this.$moment.duration(
        this.$moment
          .unix(new Date(this.decay.decay_end))
          .diff(this.$moment.unix(new Date(this.decay.decay_start))),
      )._data
    },
  },
}
</script>
