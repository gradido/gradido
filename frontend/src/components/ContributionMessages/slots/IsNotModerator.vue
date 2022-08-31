<template>
  <div class="slot-is-not-moderator">
    <div class="text-right">
      <b-avatar :text="initialLetters" variant="info"></b-avatar>
      <span class="ml-2 mr-2 text-bold">
        {{ message.userFirstName }} {{ message.userLastName }}
      </span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <div class="mt-2 h3">{{ message.message }}</div>
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
.slot-is-not-moderator {
  float: right;
  width: 75%;
  margin-top: 20px;
  margin-bottom: 20px;
  clear: both;
}
</style>
