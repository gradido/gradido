<template>
  <div fluid="sm">
    <user-card :balance="balance" :transactionCount="transactionCount"></user-card>
    <form-user-data />
    <hr />
    <form-user-passwort />
    <hr />
    <form-user-language />
    <hr />
    <form-user-newsletter />
  </div>
</template>
<script>
import UserCard from './UserProfile/UserCard.vue'
import FormUserData from './UserProfile/UserCard_FormUserData.vue'
import FormUserPasswort from './UserProfile/UserCard_FormUserPasswort.vue'
import FormUserLanguage from './UserProfile/UserCard_Language.vue'
import FormUserNewsletter from './UserProfile/UserCard_Newsletter.vue'

export default {
  components: {
    UserCard,
    FormUserData,
    FormUserPasswort,
    FormUserLanguage,
    FormUserNewsletter
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
}
</script>
<style></style>
