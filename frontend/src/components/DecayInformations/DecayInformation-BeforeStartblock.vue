<template>
  <div class="decayinformation-startblock">
    <div class="my-4">
      <div class="fw-bold pb-2">{{ $t('form.memo') }}</div>
      <div><memo-text :memo="memo" /></div>
    </div>
    <div class="mt-3 mb-3 text-center">
      <b>{{ $t('decay.before_startblock_transaction') }}</b>
    </div>
  </div>
</template>
<script setup>
import MemoText from '@/components/TransactionRows/MemoText'

defineProps({
  memo: String,
})
</script>
