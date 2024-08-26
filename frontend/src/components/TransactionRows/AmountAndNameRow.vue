<template>
  <div class="amount-and-name-row">
    <BRow>
      <BCol cols="5">
        <div class="text-end">
          <span class="gdd-transaction-list-item-amount">
            {{ $filters.GDD(amount) }}
          </span>
        </div>
      </BCol>
      <BCol cols="7">
        <div class="gdd-transaction-list-item-name">
          <span>{{ text }}</span>
        </div>
      </BCol>
    </BRow>
  </div>
</template>
<script>
export default {
  name: 'AmountAndNameRow',
  props: {
    amount: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
}
</script>
