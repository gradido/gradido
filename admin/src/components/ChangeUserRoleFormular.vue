<template>
  <div class="change-user-role-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div v-if="item.userId === $store.state.moderator.id" class="m-3 mb-4">
        {{ $t('userRole.notChangeYourSelf') }}
      </div>
      <div class="m-3">
        <label for="role" class="mr-3">{{ $t('userRole.selectLabel') }}</label>
        <b-form-select
          class="role-select"
          v-model="roleSelected"
          :options="roles"
          :disabled="item.userId === $store.state.moderator.id"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'

const rolesValues = {
  admin: 'admin',
  user: 'user',
}

export default {
  name: 'ChangeUserRoleFormular',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  data() {
    // Wolle
    // console.log('this.item: ', this.item)
    // console.log('this.item.isAdmin: ', this.item.isAdmin)
    // console.log('roleSelected: ', this.item.isAdmin ? 'admin' : 'user')
    return {
      // Wolle: checked: false,
      roleSelected: this.item.isAdmin ? rolesValues.admin : rolesValues.user,
      roles: [
        { value: rolesValues.user, text: this.$t('userRole.selectRoles.user') },
        { value: rolesValues.admin, text: this.$t('userRole.selectRoles.admin') },
      ],
    }
  },
  watch: {
    roleSelected(newRole, oldRole) {
      if (newRole !== oldRole) {
        // Wolle
        console.log('newRole: ', newRole)
      }
    },
  },
  methods: {
    // Wolle: deleteUser() {
    //   this.$apollo
    //     .mutate({
    //       mutation: deleteUser,
    //       variables: {
    //         userId: this.item.userId,
    //       },
    //     })
    //     .then((result) => {
    //       this.$emit('updateDeletedAt', {
    //         userId: this.item.userId,
    //         deletedAt: result.data.deleteUser,
    //       })
    //       this.checked = false
    //     })
    //     .catch((error) => {
    //       this.toastError(error.message)
    //     })
    // },
    // unDeleteUser() {
    //   this.$apollo
    //     .mutate({
    //       mutation: unDeleteUser,
    //       variables: {
    //         userId: this.item.userId,
    //       },
    //     })
    //     .then((result) => {
    //       this.toastSuccess(this.$t('user_recovered'))
    //       this.$emit('updateDeletedAt', {
    //         userId: this.item.userId,
    //         deletedAt: result.data.unDeleteUser,
    //       })
    //       this.checked = false
    //     })
    //     .catch((error) => {
    //       this.toastError(error.message)
    //     })
    // },
  },
}
</script>
<style>
.role-select {
  width: 300pt;
}
</style>
