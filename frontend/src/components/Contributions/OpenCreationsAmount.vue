<template>
  <div class="bg-white appBoxShadow gradido-border-radius p-3">
    <div class="pl-3">
      <b-row class="small">
        <b-col>Monatsbeiträge</b-col>
        <b-col class="d-none d-md-inline">Status</b-col>
        <b-col class="d-none d-md-inline text-center">Eingereicht</b-col>
        <b-col class="text-center">offene Stunden</b-col>
      </b-row>

      <b-row class="font-weight-bold pt-3">
        <b-col>{{ $d(new Date(minimalDate), 'monthAndYear') }}</b-col>
        <b-col class="d-none d-md-inline">
          {{ maxGddLastMonth > 0 ? 'Einreichen' : 'Max. erreicht' }}
        </b-col>
        <b-col class="d-none d-md-inline text-197 text-center">
          {{ (1000 - maxGddLastMonth) / 20 }} h
        </b-col>
        <b-col class="text-4 text-center">{{ maxGddLastMonth / 20 }} h</b-col>
      </b-row>

      <b-row class="font-weight-bold">
        <b-col>{{ $d(new Date(), 'monthAndYear') }}</b-col>
        <b-col class="d-none d-md-inline">
          {{ maxGddThisMonth > 0 ? 'Einreichen' : 'Max. erreicht' }}
        </b-col>
        <b-col class="d-none d-md-inline text-197 text-center">
          {{ (1000 - maxGddThisMonth) / 20 }} h
        </b-col>
        <b-col class="text-4 text-center">{{ maxGddThisMonth / 20 }} h</b-col>
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
}
</script>
