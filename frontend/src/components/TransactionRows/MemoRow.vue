<template>
  <div class="memo-row">
    <BRow>
      <BCol cols="5">
        <div class="text-end">{{ $t('form.memo') }}</div>
      </BCol>
      <BCol cols="7">
        <div class="gdd-transaction-list-message"><memo-text :memo="memo" /></div>
      </BCol>
    </BRow>
  </div>
</template>
<script>
import MemoText from '@/components/TransactionRows/MemoText'

export default {
  name: 'MemoRow',
  components: {
    MemoText,
  },
  props: {
    memo: {
      type: String,
      required: true,
    },
  },
}
</script>
