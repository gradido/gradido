<template>
  <div class="deleted-user-formular">
    <div v-if="item.userId === $store.state.moderator.id" class="mt-5 mb-5">
      {{ $t('removeNotSelf') }}
    </div>
    <div v-else class="mt-5">
      <b-form-checkbox switch size="lg" v-model="checked">
        <div>{{ item.deletedAt ? $t('undelete_user') : $t('delete_user') }}</div>
      </b-form-checkbox>

      <div class="mt-3 mb-5">
        <b-button v-if="checked && item.deletedAt === null" variant="danger" @click="deleteUser">
          {{ $t('delete_user') }}
        </b-button>
        <b-button v-if="checked && item.deletedAt !== null" variant="success" @click="unDeleteUser">
          {{ $t('undelete_user') }}
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
      required: true,
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
        .then((result) => {
          this.$emit('updateDeletedAt', {
            userId: this.item.userId,
            deletedAt: result.data.deleteUser,
          })
          this.checked = false
        })
        .catch((error) => {
          this.toastError(error.message)
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
        .then((result) => {
          this.toastSuccess(this.$t('user_recovered'))
          this.$emit('updateDeletedAt', {
            userId: this.item.userId,
            deletedAt: result.data.unDeleteUser,
          })
          this.checked = false
        })
        .catch((error) => {
          this.toastError(error.message)
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
