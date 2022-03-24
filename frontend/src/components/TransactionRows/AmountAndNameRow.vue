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
          <b-link v-if="linkedUser && linkedUser.email" @click.stop="tunnelEmail">
            {{ itemText }}
          </b-link>
          <span v-else>{{ itemText }}</span>
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
    linkedUser: {
      type: Object,
      required: false,
    },
    text: {
      type: String,
      required: false,
    },
  },
  methods: {
    tunnelEmail() {
      this.$emit('set-tunneled-email', this.linkedUser.email)
      this.$router.push({ path: '/send' })
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
