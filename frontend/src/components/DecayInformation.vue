<template>
  <div v-if="decay">
    <span v-if="decaytyp === 'short'">
      <small>{{ decay ? ' ' + decay.balance + ' ' + decay_start_block_text_short : '' }}</small>
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
                <span>{{ $d($moment.unix(decay.decay_start), 'long') }} Uhr</span>
              </div>
            </div>
          </div>

          <div class="d-flex">
            <div style="width: 40%" class="text-right pr-3 mr-2">
              {{ $t('decay.past_time') }}
            </div>
            <div style="width: 60%">
              <div v-if="decay.decay_start_block > 0">{{ $t('decay.since_introduction') }}</div>
              <i>{{ getDuration(decay.decay_end, decay.decay_start) }}</i>
              <span v-if="this.duration != {}">
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

    <div v-if="decaytyp === 'long'" class="pl-6 pr-6 pt-3 pb-3" style="background-color: #f5365c0d">
      <b-icon icon="droplet-half" class="mr-2 display-4" />
      <i>{{ $t('decay.calculation_decay') }}</i>
      <br />
      <br />
      <div v-if="decay.decay_start_block > 0">
        <div class="display-3">{{ $t('decay.Starting_block_decay') }} :</div>
        <div>
          {{ $t('decay.decay_introduced') }} : {{ $d($moment.unix(decay.decay_start), 'long') }}
        </div>
      </div>
      <div v-else>
        <div>{{ $t('decay.last_transaction') }}:</div>
        <span>{{ $d($moment.unix(decay.decay_start), 'long') }} Uhr</span>
      </div>
      <br />
      {{ $t('decay.past_time') }}
      <span v-if="decay.decay_start_block > 0">{{ $t('decay.since_introduction') }}</span>
      :
      <i>{{ getDuration(decay.decay_end, decay.decay_start) }}</i>
      <span v-if="this.duration != {}">
        <b v-if="duration.years > 0">{{ duration.years }} {{ $t('decay.year') }},</b>
        <b v-if="duration.months > 0">{{ duration.months }} {{ $t('decay.months') }},</b>
        <b v-if="duration.days > 0">{{ duration.days }} {{ $t('decay.days') }},</b>
        <b v-if="duration.hours > 0">{{ duration.hours }} {{ $t('decay.hours') }},</b>
        <b v-if="duration.minutes > 0">{{ duration.minutes }} {{ $t('decay.minutes') }},</b>
        <b v-if="duration.seconds > 0">{{ duration.seconds }} {{ $t('decay.seconds') }}</b>
      </span>
      <br />
      {{ $t('decay.decay') }}:
      <b>{{ decay ? decay.balance + ' GDD' : '' }}</b>
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
    decaytyp: '',
  },
  data() {
    return {
      a: 0,
      b: 0,
      duration: {},
      diff: {},
      decay_start_block_text_short: this.decay.decay_start_block
        ? ' - Startblock Decay am: ' + this.$d(this.$moment.unix(this.decay.decay_start_block))
        : '',
    }
  },
  methods: {
    getDuration(start, end) {
      // console.log("start", start)
      // console.log("end", end)
      this.a = new Date(start)
      this.b = new Date(end)
      this.a = this.$moment.unix(this.a)
      this.b = this.$moment.unix(this.b)
      this.diff = this.$moment.duration(this.a.diff(this.b))
      this.duration = this.diff._data
    },
  },
}
</script>
