<template>
  <div class="gdd-status">
    <div class="p-0 gdd-status-gdd" v-if="gdd">
      {{ pending ? '—' : $n(balance, 'decimal') }} GDD
    </div>
    <div :class="gdd ? 'p-0 text-right gdd-status-gdt' : 'p-0 gdd-status-gdt'" v-if="gdt">
      {{ pending ? '—' : $n(GdtBalance, 'decimal') }} GDT
    </div>
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
    gdd: {
      type: Boolean,
      default: true,
    },
    gdt: {
      type: Boolean,
      default: true,
    },
  },
}
</script>
