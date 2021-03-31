<template>
  <div>
    <b-row v-show="this.row_form">
      <b-col xl="6" md="6">
        <stats-card
          type="gradient-red"
          sub-title="balance_gdd"
          class="mb-4 h1"
          style="background-color: #ebebeba3 !important"
        >
          {{ $n($store.state.user.balance) }} GDD
        </stats-card>
      </b-col>
      <b-col xl="6" md="6">
        <stats-card
          type="gradient-orange"
          sub-title="balance_gdt"
          class="mb-4 h1"
          style="background-color: #ebebeba3 !important"
        >
          {{ $n($store.state.user.balance_gdt) }} GDT
        </stats-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
export default {
  name: 'GddStatus',
  props: {
    row_form: { type: Boolean, default: true },
  },
}
</script>
