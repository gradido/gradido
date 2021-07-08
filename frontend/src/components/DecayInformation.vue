<template>
  <div v-if="decay">
    <span v-if="decaytyp === 'short'">
      <small>{{ decay ? ' ' + decay.balance : '' }}</small>
    </span>

    <div v-else class="pl-6 pr-6 pt-3" style="background-color: #f5365c0d">
      <b-icon icon="droplet-half" class="mr-2 display-4" />
      <i>Berechnung der Vergänglichkeit</i>

      <br />
      <br />
      Letzte Transaktion:
      <span>{{ $d($moment.unix(decay.decay_start), 'long') }} Uhr</span>

      <br />
      Vergangene Zeit:
      <i>{{ getDuration(decay.decay_end, decay.decay_start) }}</i>
      <span v-if="this.duration != {}">
        <b v-if="duration.years > 0">{{ duration.years }} Jahre,</b>
        <b v-if="duration.months > 0">{{ duration.months }} Monate,</b>
        <b v-if="duration.days > 0">{{ duration.days }} Tage,</b>
        <b v-if="duration.hours > 0">{{ duration.hours }} Stunden,</b>
        <b v-if="duration.minutes > 0">{{ duration.minutes }} Minuten,</b>
        <b v-if="duration.seconds > 0">{{ duration.seconds }} Sekunden</b>
      </span>
      <br />
      Vergänglichkeit:
      <b>{{ decay ? decay.balance + ' GDD' : '' }}</b>
      <hr />
      <i>{{ decay.decay_duration }}</i>
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
    decaytyp: '',
  },
  data() {
    return {
      a: 0,
      b: 0,
      duration: {},
      diff: {},
    }
  },
  created() {
    console.log("start", start)
  },
  methods: {
    getDuration(start, end) {    
      console.log("start", start)
      console.log("end", end)
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
