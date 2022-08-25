<template>
  <div class="slot-is-not-moderator">
    <div class="text-right">
      <b-avatar
        :text="`${message.userFirstName[0]} ${message.userLastName[0]}`"
        variant="info"
      ></b-avatar>
      <span class="ml-2 mr-2 text-bold">
        {{ message.userFirstName }} {{ message.userLastName }}
      </span>
      <div class="mt-2 text-bold h4">{{ message.message }}</div>
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
  width: 75%;
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
