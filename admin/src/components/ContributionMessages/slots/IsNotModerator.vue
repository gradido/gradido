<template>
  <div class="slot-is-not-moderator">
    <div>
      <b-avatar
        :text="`${message.userFirstName[0]} ${message.userLastName[0]}`"
        variant="info"
      ></b-avatar>
      <span class="ml-2 mr-2 text-bold">
        {{ message.userFirstName }} {{ message.userLastName }}
      </span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
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
.slot-is-not-moderator {
  clear: both;
  width: 75%;
  margin-top: 20px;
}
</style>
