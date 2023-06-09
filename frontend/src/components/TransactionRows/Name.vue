<template>
  <div class="name">
    <div class="gdd-transaction-list-item-name">
      <div v-if="linkedUser && linkedUser.gradidoID">
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
    async tunnelEmail() {
      if (this.$route.path !== '/send') await this.$router.push({ path: '/send' })
      this.$router.push({ query: { gradidoID: this.linkedUser.gradidoID } })
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
