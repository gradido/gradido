<template>
  <div>
    <b-row>
      <b-col>
        <b-card style="background-color: #ebebeba3 !important">
          {{ pending ? '—' : $n(balance, 'decimal') }} GDD
        </b-card>
      </b-col>
      <b-col>
        <b-card class="lg-h2 text-right" style="background-color: #ebebeba3 !important">
          {{ pending ? '—' : $n(GdtBalance, 'decimal') }} GDT
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
    pending: {
      type: Boolean,
      default: true,
    },
  },
}
</script>
