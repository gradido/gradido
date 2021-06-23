<template>
  <b-container fluid>
    <user-card :balance="balance" :transactionCount="transactionCount"></user-card>
    <form-user-data />
    <!--<form-username />-->
    <form-user-passwort />
  </b-container>
</template>
<script>
import UserCard from './UserProfile/UserCard.vue'
import FormUserData from './UserProfile/UserCard_FormUserData.vue'
// import FormUsername from './UserProfile/UserCard_FormUsername.vue'
import FormUserPasswort from './UserProfile/UserCard_FormUserPasswort.vue'

export default {
  components: {
    UserCard,
    FormUserData,
    // FormUsername,
    FormUserPasswort,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
}
</script>
<style></style>
