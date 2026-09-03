<template>
  <div class="name">
    <div class="gdd-transaction-list-item-name">
      <div v-if="linked && linkedUser && linkedUser.gradidoID">
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
    /**
     * Whether the community goes behind the name, after a slash. True everywhere it has
     * always been -- in a booking row that suffix is what marks a member of ANOTHER
     * community. The contact list gives the community a line of its own instead (mockup
     * V02) and switches it off here, rather than handing this component a doctored user.
     */
    withCommunity: {
      type: Boolean,
      required: false,
      default: true,
    },
    /**
     * Whether the name is a link into the send form. True everywhere it has always been.
     *
     * ⛔ False where the row itself already means something: in the contact list and in the
     * contacts column a tap opens the contact window (KF-010). An anchor inside a button is
     * invalid HTML with no agreed behaviour, and it would give one word two destinations.
     * Told to this component rather than solved by catching the click outside it, because
     * the anchor is only ever rendered here.
     */
    linked: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  computed: {
    // How the wallet names a member (NU-018), plus the community they belong to.
    itemText() {
      if (!this.linkedUser) return this.text
      const alias = memberAlias(this.linkedUser.alias, this.linkedUser.gradidoID)
      return this.withCommunity && this.linkedUser.communityName
        ? alias + ' / ' + this.linkedUser.communityName
        : alias
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
