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
            @click="showModal('changeUserRole')"
          >
            {{ $t('change_user_role') }}
          </b-button>
        </div>
      </div>
    </div>

    <b-modal
      id="user-role-modal"
      hide-header-close
      ok-variant="danger"
      :title="modalTitle"
      :cancel-title="$t('overlay.cancel')"
      :ok-title="modalOkTitle"
      @ok="modalEvent"
    >
      <p class="my-4">{{ modalQuestion }}</p>
    </b-modal>
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
      currentRole: this.item.isAdmin ? rolesValues.admin : rolesValues.user,
      roleSelected: this.item.isAdmin ? rolesValues.admin : rolesValues.user,
      roles: [
        { value: rolesValues.user, text: this.$t('userRole.selectRoles.user') },
        { value: rolesValues.admin, text: this.$t('userRole.selectRoles.admin') },
      ],
      modalTitle: '',
      modalQuestion: '',
      modalOkTitle: '',
      modalEvent: null,
      username: '',
    }
  },
  watch: {
    // roleSelected(newRole, oldRole) {
    //   if (newRole !== oldRole) {
    //     // this.setUserRole(newRole, oldRole)
    //   }
    // },
  },
  methods: {
    showModal() {
      this.username = `${this.item.firstName} ${this.item.lastName}`
      this.modalTitle = this.$t('overlay.changeUserRole.title')
      this.modalQuestion = this.$t('overlay.changeUserRole.question', {
        username: this.username,
        newRole: this.roleSelected, // TODO get the text:Administrator instead of admin
      })
      this.modalOkTitle = this.$t('overlay.changeUserRole.yes')
      this.modalEvent = this.setUserRole(this.roleSelected, this.currentRole)
    },
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
