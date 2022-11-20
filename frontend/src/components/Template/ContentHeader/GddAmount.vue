<template>
  <div class="wallet-amount">
    <div>GDD Amount components</div>
    <div>{{ balance | GDD }}</div>
  </div>
</template>
<script>
export default {
  name: 'GddAmount',
  props: {
    balance: { type: Number, required: true },
  },
}
</script>
