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
          {{ itemText }}
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'Amount-And-Name',
  props: {
    amount: {
      type: String,
      required: true,
    },
    linkedUser: {
      type: Object,
      required: false,
    },
    text: {
      type: String,
      required: false,
    },
  },
  computed: {
    itemText() {
      return this.linkedUser
        ? this.linkedUser.firstName + ' ' + this.linkedUser.lastName
        : this.text
    },
  },
}
</script>
