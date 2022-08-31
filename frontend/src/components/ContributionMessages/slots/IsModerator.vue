<template>
  <div class="slot-is-moderator">
    <b-avatar square :text="initialLetters" variant="warning"></b-avatar>
    <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
    <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
    <small class="ml-4 text-success">{{ $t('community.moderator') }}</small>
    <div class="mt-2 h3">{{ message.message }}</div>
  </div>
</template>
<script>
export default {
  props: {
    message: {
      type: Object,
      default() {
        return {}
      },
    },
  },
  computed: {
    initialLetters() {
      return `${this.message.userFirstName[0]} ${this.message.userLastName[0]}`
    },
  },
}
</script>
<style>
.slot-is-moderator {
  clear: both;
  /* background-color: rgb(255, 242, 227); */
  width: 75%;
  margin-top: 20px;
}
</style>
