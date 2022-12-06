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
          <span v-if="linkedUser && linkedUser.email">
            <b-link @click.stop="tunnelEmail">
              {{ itemText }}
            </b-link>
          </span>
          <span v-else>{{ itemText }}</span>
          <span v-if="linkId">
            {{ $t('via_link') }}
            <b-icon
              icon="link45deg"
              variant="muted"
              class="m-mb-1"
              :title="$t('gdd_per_link.redeemed-title')"
            />
          </span>
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
    linkId: {
      type: Number,
      required: false,
      default: null,
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
