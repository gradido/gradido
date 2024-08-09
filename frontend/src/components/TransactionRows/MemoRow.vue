<template>
  <div class="memo-row">
    <BRow>
      <BCol cols="5">
        <div class="text-right">{{ $t('form.memo') }}</div>
      </BCol>
      <BCol cols="7">
        <div class="gdd-transaction-list-message">{{ memo }}</div>
      </BCol>
    </BRow>
  </div>
</template>
<script>
export default {
  name: 'MemoRow',
  props: {
    memo: {
      type: String,
      required: true,
    },
  },
}
</script>
