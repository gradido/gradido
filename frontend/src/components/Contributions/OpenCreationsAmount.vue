<template>
  <div class="px-2">
    <div>
      <b-row class="small">
        <b-col>Monatsbeiträge</b-col>
        <b-col class="d-none d-md-inline">Status</b-col>
        <b-col class="d-none d-md-inline">Eingereicht</b-col>
        <b-col>offene Stunden</b-col>
      </b-row>

      <b-row>
        <b-col>{{ $d(new Date(minimalDate), 'monthAndYear') }}</b-col>
        <b-col class="d-none d-md-inline">
          {{ maxGddLastMonth > 0 ? 'Einreichen' : 'Max. erreicht' }}
        </b-col>
        <b-col class="d-none d-md-inline">{{ (1000 - maxGddLastMonth) / 20 }} h</b-col>
        <b-col>{{ maxGddLastMonth / 20 }} h</b-col>
      </b-row>

      <b-row>
        <b-col>{{ $d(new Date(), 'monthAndYear') }}</b-col>
        <b-col class="d-none d-md-inline">
          {{ maxGddThisMonth > 0 ? 'Einreichen' : 'Max. erreicht' }}
        </b-col>
        <b-col class="d-none d-md-inline">{{ (1000 - maxGddThisMonth) / 20 }} h</b-col>
        <b-col>{{ maxGddThisMonth / 20 }} h</b-col>
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
