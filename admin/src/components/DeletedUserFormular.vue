<template>
  <div class="deleted-user-formular">
    <div v-if="item.userId === $store.state.moderator.id" class="mt-5 mb-5">
      {{ $t('removeNotSelf') }}
    </div>
    <div v-else class="mt-5">
      <div class="mt-3 mb-5">
        <b-button
          v-if="!item.deletedAt"
          v-b-modal.delete-user-modal
          variant="danger"
          @click="showDeleteModal()"
        >
          {{ $t('delete_user') }}
        </b-button>
        <b-button v-else v-b-modal.delete-user-modal variant="success" @click="showUndeleteModal()">
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
  emits: ['update-deleted-at'],
  methods: {
    showDeleteModal() {
      this.$bvModal
        .msgBoxConfirm(
          this.$t('overlay.deleteUser.question', {
            username: `${this.item.firstName} ${this.item.lastName}`,
          }),
          {
            cancelTitle: this.$t('overlay.cancel'),
            centered: true,
            hideHeaderClose: true,
            title: this.$t('overlay.deleteUser.title'),
            okTitle: this.$t('overlay.deleteUser.yes'),
            okVariant: 'danger',
            static: true,
          },
        )
        .then((okClicked) => {
          if (okClicked) {
            this.deleteUser()
          }
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    showUndeleteModal() {
      this.$bvModal
        .msgBoxConfirm(
          this.$t('overlay.undeleteUser.question', {
            username: `${this.item.firstName} ${this.item.lastName}`,
          }),
          {
            cancelTitle: this.$t('overlay.cancel'),
            centered: true,
            hideHeaderClose: true,
            title: this.$t('overlay.undeleteUser.title'),
            okTitle: this.$t('overlay.undeleteUser.yes'),
            okVariant: 'success',
          },
        )
        .then((okClicked) => {
          if (okClicked) {
            this.unDeleteUser()
          }
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    deleteUser() {
      this.$apollo
        .mutate({
          mutation: deleteUser,
          variables: {
            userId: this.item.userId,
          },
        })
        .then((result) => {
          this.$emit('update-deleted-at', {
            userId: this.item.userId,
            deletedAt: result.data.deleteUser,
          })
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
          this.$emit('update-deleted-at', {
            userId: this.item.userId,
            deletedAt: result.data.unDeleteUser,
          })
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
  background-color: rgb(255 252 205);
}
</style>
