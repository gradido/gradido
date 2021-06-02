<template>
  <b-container fluid>
    <user-card :balance="balance" :transactionCount="transactionCount"></user-card>
    <form-user-data
      :userdata="userdata"
      @update-userdata="updateUserdata"
      :UserProfileTestData="UserProfileTestData"
    />
    <form-username />
    <form-user-passwort />
  </b-container>
</template>
<script>
import loginAPI from '../../apis/loginAPI'
import UserCard from './UserProfile/UserCard.vue'
import FormUserData from './UserProfile/UserCard_FormUserData.vue'
import FormUsername from './UserProfile/UserCard_FormUsername.vue'
import FormUserPasswort from './UserProfile/UserCard_FormUserPasswort.vue'

export default {
  components: {
    UserCard,
    FormUserData,
    FormUsername,
    FormUserPasswort,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    UserProfileTestData: { type: Object },
  },
  data() {
    return {
      userdata: {},
    }
  },
  methods: {
    async getUserdata() {
      const result = await loginAPI.getUserInfos(
        this.$store.state.sessionId,
        this.$store.state.email,
      )
      // console.log(result.result.data.userData)
      if (result.success) {
        this.userdata = result.result.data.userData
      } else {
        alert(result.result.message)
      }
    },
    async updateUserdata(data) {
      // console.log(data)
      const result = await loginAPI.updateUserInfos(
        this.$store.state.sessionId,
        this.$store.state.email,
      )
      // console.log(result)
      if (result.success) {
        alert(result)
      } else {
        alert(result.result.message)
      }
    },
  },
  async created() {
    this.getUserdata()
  },
}
</script>
<style></style>
