<template>
  <div class="decayinformation-startblock">
    <!-- if balanceDate <  decayStartBlock - Wenn die transaktion vor dem einführen der dacay function liegt. -->
    <div class="mt-3 mb-3 text-center">
      <b>{{ $t('decay.before_startblock_transaction') }}</b>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-StartBlock',
  props: {
    balanceDate: { type: String },
    decayStartBlock: { type: String },
  },
}
</script>
