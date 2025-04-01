<template>
  <div class="name">
    <div class="gdd-transaction-list-item-name">
      <div v-if="linkedUser && linkedUser.gradidoID">
        <router-link :class="fontColor" :to="pushTo">
          {{ itemText }}
        </router-link>
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
  computed: {
    itemText() {
      return this.linkedUser
        ? this.linkedUser.alias
          ? this.linkedUser.alias +
            (this.linkedUser.communityName ? ' / ' + this.linkedUser.communityName : '')
          : this.linkedUser.firstName +
            ' ' +
            this.linkedUser.lastName +
            (this.linkedUser.communityName ? ' / ' + this.linkedUser.communityName : '')
        : this.text
    },
    pushTo() {
      return {
        name: 'Send',
        params: {
          userIdentifier: this.linkedUser.gradidoID,
          communityIdentifier: this.linkedUser.communityUuid,
        },
      }
    },
  },
  methods: {
    async tunnelEmail() {
      if (this.$route.path !== '/send') await this.$router.push({ path: '/send' })
      this.$router.push({
        params: {
          userIdentifier: this.linkedUser.gradidoID,
          communityIdentifier: this.linkedUser.communityUuid,
        },
      })
    },
  },
}
</script>
