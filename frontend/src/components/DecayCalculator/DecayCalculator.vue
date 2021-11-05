<template>
  <div id="decay_calculator">
    <div>
      <b-calendar v-model="value" :min="min" locale="en" v-on:selected="getDays"></b-calendar>
    </div>
    <b>{{ gdd }} GDD</b>
    <div>days: {{ days }}</div>
    <div>seconds: {{ seconds }}</div>
    <div>
      Vergänglichkeit:
      <b>{{ decays }}</b>
    </div>
  </div>
</template>
<script>
const now = new Date()

export default {
  data() {
    return {
      value: '',
      min: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      start: '',
      end: '',
      days: 0,
      seconds: 0,
      decays: 0,
      gdd: 1000,
    }
  },
  methods: {
    getDays() {
      const start = this.$moment(this.today)
      const end = this.$moment(this.value)

      this.days = end.diff(start, 'days')
      this.seconds = end.diff(start, 'seconds')
      this.decays = this.gdd - this.gdd * Math.pow(0.99999997802044727, this.seconds)
    },
  },
}
</script>
