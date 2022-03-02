<template>
  <div class="decayinformation-first-transaction">
    <div>
      <!-- if decay.start === null - Wenn kein decay angegeben dan ist es die erste Transaktion -->
      <div class="mt-3 mb-3 text-center">
        <b>{{ $t('decay.first_transaction') }}</b>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-FirstTransaction',
  props: {
    decay: {
      type: Object,
    },
  },
}
</script>
