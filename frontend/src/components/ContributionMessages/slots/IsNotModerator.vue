<template>
  <div class="slot-is-not-moderator">
    <div class="text-right">
      <b-avatar text="BV"></b-avatar>
      <span class="ml-2 mr-2 text-bold">
        {{ message.userFirstName }} {{ message.userLastName }}
      </span>
      <div class="mt-2">{{ message }}</div>
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
}
</script>
<style>
.clear {
  clear: both;
}
.slot-is-not-moderator {
  clear: both;
  float: right;
  background-color: aquamarine;
  width: 75%;
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
