<template>
  <div>
    <div
      class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center profile-header"
    >
      <b-container fluid></b-container>
    </div>

    <b-container fluid class="mt--6">
      <b-row>
        <b-col xl="12" class="order-xl-2 mb-5">
          <user-card></user-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import UserCard from "./UserProfile/UserCard.vue";

export default {
  components: {
    UserCard
  }
};
</script>
<style></style>
