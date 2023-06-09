<template>
  <div class="decayinformation-startblock">
    <div class="my-4">
      <div class="font-weight-bold pb-2">{{ $t('form.memo') }}</div>
      <div>{{ memo }}</div>
    </div>
    <div class="mt-3 mb-3 text-center">
      <b>{{ $t('decay.before_startblock_transaction') }}</b>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-StartBlock',
  props: {
    memo: {
      type: String,
      required: true,
    },
  },
}
</script>
