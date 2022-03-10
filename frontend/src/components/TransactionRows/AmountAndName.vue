<template>
  <div class="amount-and-name">
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
          {{ linkedUser ? linkedUser.firstName + ' ' + linkedUser.lastName : text }}
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'AmountAndName',
  props: {
    amount: {
      type: String,
    },
    linkedUser: {
      type: Object,
    },
    text: {
      type: String,
    },
  },
}
</script>
