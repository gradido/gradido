<template>
  <div class="mt-sm-4 mt-lg-5">
    <user-card
      :balance="balance"
      :transactionCount="transactionCount"
      :UserProfileTestData="UserProfileTestData"
    ></user-card>
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
    transactionCount: { type: Number, default: 0 },
    UserProfileTestData: { type: Object },
  },
}
</script>
<style></style>
