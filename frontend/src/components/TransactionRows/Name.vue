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
import { memberAlias } from '@/utils/gradidoAddress'

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
    // How the wallet names a member (NU-018), plus the community they belong to.
    itemText() {
      return this.linkedUser
        ? memberAlias(this.linkedUser.alias, this.linkedUser.gradidoID) +
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
<style scoped>
/* A 36-character gradidoID fallback must not blow up the booking row on a phone:
   clipped visually with an ellipsis, while the full value stays in the text and stays
   copyable (NU-018). Both the inner div (router-link case) and the bare span form
   their own line, so both need the clipping. */
.gdd-transaction-list-item-name,
.gdd-transaction-list-item-name > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
