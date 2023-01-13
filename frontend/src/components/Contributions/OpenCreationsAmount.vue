<template>
  <div class="bg-white appBoxShadow gradido-border-radius p-3">
    <div class="pl-3">
      <b-row class="small">
        <b-col>{{ $t('time.months') }}</b-col>
        <b-col class="d-none d-md-inline">{{ $t('status') }}</b-col>
        <b-col class="d-none d-md-inline text-center">{{ $t('submitted') }}</b-col>
        <b-col class="text-center">{{ $t('openHours') }}</b-col>
      </b-row>

      <b-row class="font-weight-bold pt-3">
        <b-col>{{ $d(new Date(minimalDate), 'monthAndYear') }}</b-col>
        <b-col class="d-none d-md-inline">
          {{ maxGddLastMonth > 0 ? $t('contribution.submit') : $t('maxReached') }}
        </b-col>
        <b-col class="d-none d-md-inline text-197 text-center">
          {{ hoursSubmittedLastMonth }} {{ $t('h') }}
        </b-col>
        <b-col class="text-4 text-center">{{ hoursAvailableLastMonth }} {{ $t('h') }}</b-col>
      </b-row>

      <b-row class="font-weight-bold">
        <b-col>{{ $d(new Date(), 'monthAndYear') }}</b-col>
        <b-col class="d-none d-md-inline">
          {{ maxGddThisMonth > 0 ? $t('contribution.submit') : $t('maxReached') }}
        </b-col>
        <b-col class="d-none d-md-inline text-197 text-center">
          {{ hoursSubmittedThisMonth }} {{ $t('h') }}
        </b-col>
        <b-col class="text-4 text-center">{{ hoursAvailableThisMonth }} {{ $t('h') }}</b-col>
      </b-row>
    </div>
  </div>
</template>
<script>
export default {
  name: 'OpenCreationsAmount',
  props: {
    minimalDate: { type: Date, required: true },
    maxGddLastMonth: { type: Number, required: true },
    maxGddThisMonth: { type: Number, required: true },
  },
  computed: {
    hoursSubmittedThisMonth() {
      return (1000 - this.maxGddThisMonth) / 20
    },
    hoursSubmittedLastMonth() {
      return (1000 - this.maxGddLastMonth) / 20
    },
    hoursAvailableThisMonth() {
      return this.maxGddThisMonth / 20
    },
    hoursAvailableLastMonth() {
      return this.maxGddLastMonth / 20
    },
  },
}
</script>
