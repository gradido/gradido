<template>
  <div class="slot-is-moderator">
    <b-avatar
      square
      :text="`${message.userFirstName[0]} ${message.userLastName[0]}`"
      variant="warning"
    ></b-avatar>
    <span class="ml-2 mr-2">
      {{ message.userFirstName }} {{ message.userLastName }}
      <small class="ml-4 text-success">{{ $t('moderator') }}</small>
    </span>
    <div class="mt-2 text-bold h4">{{ message.message }}</div>
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
  width: 75%;
  margin-top: 20px;
}
</style>
