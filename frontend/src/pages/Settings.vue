<template>
  <div class="container">
    <user-card :balance="balance" :transactionCount="transactionCount"></user-card>
    <user-data />
    <hr />
    <user-password />
    <hr />
    <user-language />
    <hr />
    <user-newsletter />
  </div>
</template>
<script>
import UserCard from '@/components/UserSettings/UserCard.vue'
import UserData from '@/components/UserSettings/UserData.vue'
import UserPassword from '@/components/UserSettings/UserPassword.vue'
import UserLanguage from '@/components/UserSettings/UserLanguage.vue'
import UserNewsletter from '@/components/UserSettings/UserNewsletter.vue'

export default {
  name: 'Profile',
  components: {
    UserCard,
    UserData,
    UserPassword,
    UserLanguage,
    UserNewsletter,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  methods: {
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.updateTransactions(0)
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
