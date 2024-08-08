<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-3">
    <div class="pl-3">
      <BRow class="small">
        <BCol>{{ $t('time.months') }}</BCol>
        <BCol class="d-none d-md-inline">{{ $t('status') }}</BCol>
        <BCol class="d-none d-md-inline text-center">{{ $t('submitted') }}</BCol>
        <BCol class="text-center">{{ $t('openHours') }}</BCol>
      </BRow>

      <BRow class="font-weight-bold pt-3">
        <BCol>{{ $d(new Date(minimalDate), 'monthAndYear') }}</BCol>
        <BCol class="d-none d-md-inline">
          {{ maxGddLastMonth > 0 ? $t('contribution.submit') : $t('maxReached') }}
        </BCol>
        <BCol class="d-none d-md-inline text-197 text-center">
          {{ hoursSubmittedLastMonth }} {{ $t('h') }}
        </BCol>
        <BCol class="text-4 text-center">{{ hoursAvailableLastMonth }} {{ $t('h') }}</BCol>
      </BRow>

      <BRow class="font-weight-bold">
        <BCol>{{ $d(new Date(), 'monthAndYear') }}</BCol>
        <BCol class="d-none d-md-inline">
          {{ maxGddThisMonth > 0 ? $t('contribution.submit') : $t('maxReached') }}
        </BCol>
        <BCol class="d-none d-md-inline text-197 text-center">
          {{ hoursSubmittedThisMonth }} {{ $t('h') }}
        </BCol>
        <BCol class="text-4 text-center">{{ hoursAvailableThisMonth }} {{ $t('h') }}</BCol>
      </BRow>
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
