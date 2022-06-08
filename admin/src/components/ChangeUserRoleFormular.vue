<template>
  <div class="change-user-role-formular">
    <div v-if="item.userId === $store.state.moderator.id" class="mt-5 mb-5">
      {{ $t('userRole.notChangeYourSelf') }}
    </div>
    <!-- Wolle: <div v-else class="mt-5"> -->
    <div class="mt-5">
      <!-- Wolle: <b-form-checkbox switch size="lg" v-model="checked">
        <div>{{ item.deletedAt ? $t('undelete_user') : $t('delete_user') }}</div>
      </b-form-checkbox>

      <div class="mt-3 mb-5">
        <b-button v-if="checked && item.deletedAt === null" variant="danger" @click="deleteUser">
          {{ $t('delete_user') }}
        </b-button>
        <b-button v-if="checked && item.deletedAt !== null" variant="success" @click="unDeleteUser">
          {{ $t('undelete_user') }}
        </b-button>
      </div> -->
      {{ $t('userRole.selectLabel') }}
      <b-form-select v-model="selected" :options="options"></b-form-select>
    </div>
  </div>
</template>
<script>
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'

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
    console.log('this.item: ', this.item)
    return {
      // Wolle: checked: false,
      selected: this.item.isAmin ? 'admin' : 'user',
      options: [
        { value: 'user', text: 'einfacher Nutzer' },
        { value: 'admin', text: 'Administrator' },
      ],
    }
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
.input-group-text {
  background-color: rgb(255, 252, 205);
}
</style>
