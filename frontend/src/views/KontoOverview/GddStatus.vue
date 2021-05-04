<template>
  <div>
    <b-row v-show="showTransactionList">
      <b-col xl="6" md="6">
        <stats-card
          type="gradient-red"
          sub-title="balance_gdd"
          class="mb-4 h1"
          style="background-color: #ebebeba3 !important"
        >
          {{ $n(balance) }} GDD
        </stats-card>
      </b-col>
      <b-col xl="6" md="6">
        <stats-card
          type="gradient-orange"
          sub-title="balance_gdt"
          class="mb-4 h1"
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
    showTransactionList: { type: Boolean, default: true },
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
  },
}
</script>
