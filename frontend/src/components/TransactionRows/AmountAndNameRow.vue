<template>
  <div class="amount-and-name-row">
    <b-row>
      <b-col cols="5">
        <div class="text-right">
          <span class="gdd-transaction-list-item-amount">
            {{ amount | GDD }}
          </span>
        </div>
      </b-col>
      <b-col cols="7">
        <div class="gdd-transaction-list-item-name">
          <span>{{ text }}</span>
        </div>
      </b-col>
    </b-row>
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
