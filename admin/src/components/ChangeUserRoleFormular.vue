<template>
  <div class="change-user-role-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div v-if="item.userId === $store.state.moderator.id" class="m-3 mb-4">
        {{ $t('userRole.notChangeYourSelf') }}
      </div>
      <div v-else class="m-3">
        <label for="role" class="mr-3">{{ $t('userRole.selectLabel') }}</label>
        <b-form-select class="role-select" v-model="roleSelected" :options="roles" />
        <div class="mt-3 mb-5">
          <b-button
            variant="danger"
            v-b-modal.user-role-modal
            :disabled="currentRole === roleSelected"
            @click="showModal()"
          >
            {{ $t('change_user_role') }}
          </b-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { setUserRole } from '../graphql/setUserRole'

const rolesValues = {
  admin: 'admin',
  moderator: 'moderator',
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
      // currentRole: this.item.isAdmin ? rolesValues.admin : rolesValues.user,
      currentRole: this.newFunction(),
      // roleSelected: this.item.isAdmin ? rolesValues.admin : rolesValues.user,
      roleSelected: this.newFunction(),
      roles: [
        { value: rolesValues.user, text: this.$t('userRole.selectRoles.user') },
        { value: rolesValues.moderator, text: this.$t('userRole.selectRoles.moderator') },
        { value: rolesValues.admin, text: this.$t('userRole.selectRoles.admin') },
      ],
    }
  },
  methods: {
    newFunction() {
      let userRole = rolesValues.user
      if (this.item.roles.includes('ADMIN', 0)) userRole = rolesValues.admin
      else if (this.item.roles.includes('MODERATOR', 0)) userRole = rolesValues.moderator
      return userRole
    },
    showModal() {
      this.$bvModal
        .msgBoxConfirm(
          this.$t('overlay.changeUserRole.question', {
            username: `${this.item.firstName} ${this.item.lastName}`,
            newRole:
              this.roleSelected === 'admin'
                ? this.$t('userRole.selectRoles.admin')
                : this.$t('userRole.selectRoles.user'),
          }),
          {
            cancelTitle: this.$t('overlay.cancel'),
            centered: true,
            hideHeaderClose: true,
            title: this.$t('overlay.changeUserRole.title'),
            okTitle: this.$t('overlay.changeUserRole.yes'),
            okVariant: 'danger',
          },
        )
        .then((okClicked) => {
          if (okClicked) {
            this.setUserRole(this.roleSelected, this.currentRole)
          }
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    setUserRole(newRole, oldRole) {
      let role
      switch (newRole) {
        case rolesValues.admin:
        case rolesValues.moderator:
        case rolesValues.user:
          role = newRole
          break
        default:
          role = 'USER'
      }
      this.$apollo
        .mutate({
          mutation: setUserRole,
          variables: {
            userId: this.item.userId,
            role,
          },
        })
        .then((result) => {
          this.$emit('updateIsAdmin', {
            userId: this.item.userId,
            role,
          })
          this.toastSuccess(
            this.$t('userRole.successfullyChangedTo', {
              role: role.text,
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
