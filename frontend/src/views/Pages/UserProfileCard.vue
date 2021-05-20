<template>
  <div class="mt-sm-4 mt-lg-5">
    <user-card :balance="balance"></user-card>
  </div>
</template>
<script>
import UserCard from './UserProfile/UserCard.vue'

export default {
  components: {
    UserCard,
  },
  props: {
    balance: { type: Number, default: 0 },
  },
}
</script>
<style></style>
