<template>
  <div>
    {{ item }}
    <div class="mt-5">
      <b-form-checkbox switch size="lg" v-model="checked">deleted User</b-form-checkbox>
    </div>
    <div class="mt-3">GDD Stand: 20 GDD</div>
    <div class="mt-3 mb-5">
      <b-button v-if="checked" variant="danger" @click="deleteUser">Delete User</b-button>
      <b-button v-if="checked" variant="success" @click="unDeleteUser">Undelete User</b-button>
    </div>
  </div>
</template>
<script>
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'

export default {
  name: 'DeletedUser',
  props: {
    item: {
      type: Object,
    },
  },
  data() {
    return {
      checked: false,
    }
  },
  methods: {
    deleteUser() {
      this.$apollo
        .mutate({
          mutation: deleteUser,
          variables: {
            userId: this.item.userId,
          },
        })
        .then(() => {
          this.$toasted.success('user is deleted')
        })
        .catch((error) => {
          this.$toasted.error('user deleted error', error)
        })
    },
    unDeleteUser() {
      this.$apollo
        .mutate({
          mutation: unDeleteUser,
          variables: {
            userId: this.item.userId,
          },
        })
        .then(() => {
          this.$toasted.success('user is undeleted')
        })
        .catch((error) => {
          this.$toasted.error('user undeleted error', error)
        })
    },
  },
}
</script>
<style>
.input-group-text {
  background-color: rgb(255, 252, 205);
}
</style>
