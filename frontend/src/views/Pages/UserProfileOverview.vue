<template>
  <div fluid="sm">
    <user-card :balance="balance" :transactionCount="transactionCount"></user-card>
    <form-user-data />
    <hr />
    <form-user-passwort />
    <hr />
    <form-user-language />
  </div>
</template>
<script>
import UserCard from './UserProfile/UserCard.vue'
import FormUserData from './UserProfile/UserCard_FormUserData.vue'
import FormUserPasswort from './UserProfile/UserCard_FormUserPasswort.vue'
import FormUserLanguage from './UserProfile/UserCard_Language.vue'

export default {
  components: {
    UserCard,
    FormUserData,
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
