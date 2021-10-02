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
    <hr />
    <form-user-coin-animation />
  </div>
</template>
<script>
import UserCard from './UserProfile/UserCard.vue'
import FormUserData from './UserProfile/UserCard_FormUserData.vue'
import FormUserPasswort from './UserProfile/UserCard_FormUserPasswort.vue'
import FormUserLanguage from './UserProfile/UserCard_Language.vue'
import FormUserNewsletter from './UserProfile/UserCard_Newsletter.vue'
import FormUserCoinAnimation from './UserProfile/UserCard_CoinAnimation.vue'

export default {
  components: {
    UserCard,
    FormUserData,
    FormUserPasswort,
    FormUserLanguage,
    FormUserNewsletter,
    FormUserCoinAnimation,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
}
</script>
<style>
.card-border-radius {
  border-radius: 0px 5px 5px 0px !important;
}
@media screen and (max-width: 1235px) {
  .card-border-radius {
    border-radius: 0px !important;
  }
}
.card-background-gray {
  background-color: #ebebeba3 !important;
}
</style>
