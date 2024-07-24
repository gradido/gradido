<template>
  <div class="change-user-role-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div v-if="!$store.state.moderator.roles.includes('ADMIN')" class="m-3 mb-4">
        {{ roles.find((role) => role.value === currentRole).text }}
      </div>
      <div v-else-if="item.userId === $store.state.moderator.id" class="m-3 mb-4">
        {{ $t('userRole.notChangeYourSelf') }}
      </div>
      <div v-else class="m-3">
        <label for="role" class="mr-3">{{ $t('userRole.selectLabel') }}</label>
        <b-form-select v-model="roleSelected" class="role-select" :options="roles" />
        <div class="mt-3 mb-5">
          <b-button
            v-b-modal.user-role-modal
            variant="danger"
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
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  USER: 'USER',
}

export default {
  name: 'ChangeUserRoleFormular',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  emits: ['update-roles'],
  data() {
    return {
      currentRole: this.getCurrentRole(),
      roleSelected: this.getCurrentRole(),
      roles: [
        { value: rolesValues.USER, text: this.$t('userRole.selectRoles.user') },
        { value: rolesValues.MODERATOR, text: this.$t('userRole.selectRoles.moderator') },
        { value: rolesValues.ADMIN, text: this.$t('userRole.selectRoles.admin') },
      ],
    }
  },
  methods: {
    getCurrentRole() {
      if (this.item.roles.length) return rolesValues[this.item.roles[0]]
      return rolesValues.USER
    },
    showModal() {
      this.$bvModal
        .msgBoxConfirm(
          this.$t('overlay.changeUserRole.question', {
            username: `${this.item.firstName} ${this.item.lastName}`,
            newRole:
              this.roleSelected === rolesValues.ADMIN
                ? this.$t('userRole.selectRoles.admin')
                : this.roleSelected === rolesValues.MODERATOR
                  ? this.$t('userRole.selectRoles.moderator')
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
      const role = this.roles.find((role) => {
        return role.value === newRole
      })
      const roleText = role.text
      const roleValue = role.value
      this.$apollo
        .mutate({
          mutation: setUserRole,
          variables: {
            userId: this.item.userId,
            role: role.value,
          },
        })
        .then((result) => {
          this.$emit('update-roles', {
            userId: this.item.userId,
            roles: roleValue === 'USER' ? [] : [roleValue],
          })
          this.toastSuccess(
            this.$t('userRole.successfullyChangedTo', {
              role: roleText,
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
