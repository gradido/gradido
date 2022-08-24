<template>
  <div class="slot-is-moderator">
    <b-avatar square text="AA"></b-avatar>
    <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
    <div class="mt-2">{{ message }}</div>
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
}
</script>
<style>
.slot-is-moderator {
  clear: both;
  background-color: rgb(250, 158, 207);
  width: 75%;
  margin-top: 20px;
}
</style>
