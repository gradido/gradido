<template>
  <div v-if="decay">
    <div>
      <div v-if="form === 'short'">
        <small>{{ decay ? ' ' + decay.balance + ' GDD' + ' ' + $t('decay') : '' }}</small>
      </div>
      <div v-else>
        <hr />
        <i>Berechnung der Vergänglichkeit</i>
        <br />
        <br />
        Seit deiner letzten Buchungstransaktion (
        <i>{{ $d($moment.unix(decay.decay_start), 'long') }} Uhr</i>
        ) sind
        <br />
        <span>{{ getDuration(decay.decay_end, decay.decay_start) }}</span>
        <div v-if="this.duration != {}">
          <b v-if="duration.years > 0">{{ duration.years }} Jahre,</b>
          <b v-if="duration.months > 0">{{ duration.months }} Monate,</b>
          <b v-if="duration.days > 0">{{ duration.days }} Tage,</b>
          <b v-if="duration.hours > 0">{{ duration.hours }} Stunden,</b>
          <b v-if="duration.minutes > 0">{{ duration.minutes }} Minuten,</b>
          <b v-if="duration.minutes > 0">{{ duration.minutes }} Sekunden</b>
        </div>
        vergangen. Das entspricht einer
        <b>Vergänglichkeit</b>
        von
        <br />
        <br />
        <b>{{ decay ? decay.balance + ' GDD' : '' }}</b>
        <br />
        <br />
        Die Vergänglichkeit wird automatisch mit jeder Transaktion auf oder von deinem Konto
        berechnet und von deinen Gradidos automatisch abgezogen.
        <hr />
        <i>{{ decay.decay_duration }}</i>
      </div>
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
    },
    form: '',
  },
  data() {
    return {
      a: 0,
      b: 0,
      duration: {},
      diff: {},
    }
  },
  methods: {
    getDuration(start, end) {
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
