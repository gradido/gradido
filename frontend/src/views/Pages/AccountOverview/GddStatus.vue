<template>
  <div>
    <b-row>
      <b-col>
        <stats-card
          type="gradient-red"
          sub-title="balance_gdd"
          class="pt-3 h2"
          style="background-color: #ebebeba3 !important"
        >
          {{ $n(balance) }} GDD
        </stats-card>
      </b-col>
      <b-col>
        <stats-card
          type="gradient-orange"
          sub-title="balance_gdt"
          class="pt-3 h2"
          style="background-color: #ebebeba3 !important"
        >
          {{ $n(GdtBalance) }} GDT
        </stats-card>
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
