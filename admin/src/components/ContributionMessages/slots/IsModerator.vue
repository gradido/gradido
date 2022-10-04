<template>
  <div class="slot-is-moderator">
    <div class="text-right">
      <b-avatar square :text="initialLetters" variant="warning"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <small class="ml-4 text-success">{{ $t('moderator') }}</small>
      <div class="mt-2" v-html="message.message"></div>
    </div>
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
  float: right;
  width: 75%;
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
