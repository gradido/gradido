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
import { setUserRole } from '../graphql/setUserRole'

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
    return {
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
        this.setUserRole(newRole, oldRole)
      }
    },
  },
  methods: {
    setUserRole(newRole, oldRole) {
      this.$apollo
        .mutate({
          mutation: setUserRole,
          variables: {
            userId: this.item.userId,
            isAdmin: newRole === rolesValues.admin,
          },
        })
        .then((result) => {
          this.$emit('updateIsAdmin', {
            userId: this.item.userId,
            isAdmin: result.data.setUserRole,
          })
          this.toastSuccess(
            this.$t('userRole.successfullyChangedTo', {
              role:
                result.data.setUserRole !== null
                  ? this.$t('userRole.selectRoles.admin')
                  : this.$t('userRole.selectRoles.user'),
            }),
          )
        })
        .catch((error) => {
          this.roleSelected = oldRole
          this.toastError(error.message)
        })
    },
  },
}
</script>

<style>
.role-select {
  width: 300pt;
}
</style>
