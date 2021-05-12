<template>
  <div>
    <b-row class="mt-lg-5">
      <b-col>
        <b-card type="gradient-red" style="background-color: #ebebeba3 !important">
          <b>{{ $n(balance) }} GDD</b>
        </b-card>
      </b-col>
      <b-col>
        <b-card class="lg-h2 text-right" style="background-color: #ebebeba3 !important">
          {{ $n(GdtBalance) }} GDT
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
export default {
  name: 'GddStatus',
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
  },
}
</script>
