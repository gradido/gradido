<template>
  <div fluid="sm">
    <user-card :balance="balance" :transactionCount="transactionCount"></user-card>
    <p><form-user-data /></p>
    <!--<form-username />-->
    <hr />
    <p><form-user-passwort /></p>
    <hr />
    <p><form-user-language /></p>
  </div>
</template>
<script>
import UserCard from './UserProfile/UserCard.vue'
import FormUserData from './UserProfile/UserCard_FormUserData.vue'
// import FormUsername from './UserProfile/UserCard_FormUsername.vue'
import FormUserPasswort from './UserProfile/UserCard_FormUserPasswort.vue'
import FormUserLanguage from './UserProfile/UserCard_Language.vue'

export default {
  components: {
    UserCard,
    FormUserData,
    // FormUsername,
    FormUserPasswort,
    FormUserLanguage,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
}
</script>
<style></style>
