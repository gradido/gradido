<template>
  <div class="decayinformation-no-decay-transaction">
    <div>
      <!-- if decay.start === null - Wenn kein decay angegeben dan ist es die erste Transaktion -->
      <div class="mt-3 mb-3 text-center">
        <b>{{ $t('decay.before_startblock_transaction') }}</b>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-NoDecayTransaction',
  props: {
    decay: {
      type: Object,
    },
  },
}
</script>
