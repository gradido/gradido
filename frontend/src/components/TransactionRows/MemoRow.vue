<template>
  <div class="memo-row">
    <b-row>
      <b-col cols="5">
        <div class="text-right">{{ $t('form.memo') }}</div>
      </b-col>
      <b-col cols="7">
        <div class="gdd-transaction-list-message">{{ memo }}</div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'MemoRow',
  props: {
    memo: {
      type: String,
      required: false,
    },
  },
}
</script>
