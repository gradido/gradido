<template>
  <div>
    <div v-if="item.userId === $store.state.moderator.id" class="mt-5 mb-5">
      Als Admin / Moderator kannst du dich nicht selber löschen.
    </div>
    <div v-else class="mt-5">
      <b-form-checkbox switch size="lg" v-model="checked">
        <div v-if="item.deletedAt === null">Delete user</div>
        <div v-if="item.deletedAt !== null">Undelete user</div>
      </b-form-checkbox>

      <div class="mt-3 mb-5">
        <b-button v-if="checked && item.deletedAt === null" variant="danger" @click="deleteUser">
          Delete User
        </b-button>
        <b-button v-if="checked && item.deletedAt !== null" variant="success" @click="unDeleteUser">
          Undelete User
        </b-button>
      </div>
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
