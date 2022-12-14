<template>
  <div class="name">
    <div class="gdd-transaction-list-item-name">
      <div v-if="linkedUser && linkedUser.email">
        <b-link @click.stop="tunnelEmail">
          {{ itemText }}
        </b-link>
        <!-- <span v-if="transactionLinkId">
          {{ $t('via_link') }}
          <b-icon
            icon="link45deg"
            variant="muted"
            class="m-mb-1"
            :title="$t('gdd_per_link.redeemed-title')"
          />
        </span> -->
      </div>
      <span v-else>{{ itemText }}</span>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Name',
  props: {
    linkedUser: {
      type: Object,
      required: false,
    },
    text: {
      type: String,
      required: false,
    },
    // transactionLinkId: {
    //   type: Number,
    //   required: false,
    //   default: null,
    // },
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
