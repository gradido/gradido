<template>
  <div class="name">
    <div class="gdd-transaction-list-item-name">
      <div v-if="linkedUser && linkedUser.email">
        <b-link @click.stop="tunnelEmail" :class="fontColor">
          {{ itemText }}
        </b-link>
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
    fontColor: {
      type: String,
      required: false,
      default: '',
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
      if (this.$router.history.current.fullPath !== '/send') this.$router.push({ path: '/send' })
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
