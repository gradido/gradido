<template>
  <div id="decay_calculator">
    <!-- <div>
      <label for="gdd-input">
        {{ $t('decay-calculation.date-from-today') }} ({{ $moment(min).format('DD-MM-YYYY') }})
        <br />
        {{ $t('form.to') }}
      </label>
      <b-input-group class="mb-3">
        <b-form-input
          id="example-input1"
          v-model="value"
          type="text"
          placeholder="DD-MM-YYYY"
          autocomplete="off"
        ></b-form-input>
        <b-input-group-append>
          <b-form-datepicker
            v-model="value"
            :min="min"
            button-only
            right
            locale="de-DE"
            aria-controls="example-input1"
            @context="getDays"
          ></b-form-datepicker>
        </b-input-group-append>
      </b-input-group>
    </div> -->
    <!-- <div v-if="decays > 0">
      <b>{{ gdd }} GDD</b>
      <div>{{ $t('decay.days') }}: {{ days }}</div>
      <div>{{ $t('decay.seconds') }}: {{ seconds }}</div>
      <div>
        {{ $t('decay.decay') }}:
        <b>{{ decays }}</b>
      </div>
    </div> -->
    <hr />

    <div>
      <label for="gdd-input">{{ $t('form.amount') }} GDD</label>
      <b-input type="text" v-model="gddInput"></b-input>
      <label for="example-input">{{ $t('form.from') }}</label>
      <b-input-group class="mb-3">
        <b-form-input
          id="example-input2"
          v-model="valueFrom"
          type="text"
          placeholder="DD-MM-YYYY"
          autocomplete="off"
        ></b-form-input>
        <b-input-group-append>
          <b-form-datepicker
            v-model="valueFrom"
            button-only
            right
            locale="de-DE"
            aria-controls="example-input2"
          ></b-form-datepicker>
        </b-input-group-append>
      </b-input-group>
    </div>

    <div>
      <label for="example-input">to</label>
      <b-input-group class="mb-3">
        <b-form-input
          id="example-input3"
          v-model="valueTo"
          type="text"
          placeholder="DD-MM-YYYY"
          autocomplete="off"
        ></b-form-input>
        <b-input-group-append>
          <b-form-datepicker
            v-model="valueTo"
            button-only
            right
            locale="de-DE"
            aria-controls="example-input3"
            @context="onContext"
          ></b-form-datepicker>
        </b-input-group-append>
      </b-input-group>
    </div>
    <div v-if="decays2 > 0">
      <p>{{ $t('form.from') }} {{ $moment(valueFrom).format('DD-MM-YYYY') }}</p>
      <p>{{ $t('form.to') }}: {{ $moment(valueTo).format('DD-MM-YYYY') }}</p>
      <p>{{ $t('decay.days') }}: {{ days2 }}</p>
      <p>{{ $t('decay.seconds') }}: {{ seconds2 }}</p>
      <p>
        <b>{{ $t('decay.decay') }}: {{ decays2 }} GDD</b>
      </p>
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
      days2: 0,
      seconds2: 0,
      decays: 0,
      decays2: 0,
      gdd: 1000,
      valueFrom: '',
      valueTo: '',
      gddInput: 0,
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
    onContext(ctx) {
      const startfrom = this.$moment(this.valueFrom)
      const endto = this.$moment(this.valueTo)

      this.days2 = endto.diff(startfrom, 'days')
      this.seconds2 = endto.diff(startfrom, 'seconds')

      this.decays2 = this.gddInput - this.gddInput * Math.pow(0.99999997802044727, this.seconds2)
    },
  },
}
</script>
