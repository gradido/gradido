<template>
  <div class="deleted-user-formular">
    <div v-if="item.userId === $store.state.moderator.id" class="mt-5 mb-5">
      {{ $t('removeNotSelf') }}
    </div>
    <div v-else class="mt-5">
      <div class="mt-3 mb-5">
        <b-button
          v-if="item.deletedAt === null"
          variant="danger"
          v-b-modal.delete-user-modal
          @click="showModal('deleteUser')"
        >
          {{ $t('delete_user') }}
        </b-button>
        <b-button
          v-if="item.deletedAt !== null"
          variant="success"
          v-b-modal.delete-user-modal
          @click="showModal('undeleteUser')"
        >
          {{ $t('undelete_user') }}
        </b-button>
      </div>
    </div>
    <b-modal
      id="delete-user-modal"
      hide-header-close
      :title="modalTitle"
      :cancel-title="$t('overlay.cancel')"
      :ok-title="modalOkTitle"
      :ok-variant="variant"
      @ok="modalEvent"
    >
      <p class="my-4">{{ modalQuestion }}</p>
    </b-modal>
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
      modalTitle: '',
      modalQuestion: '',
      modalOkTitle: '',
      modalEvent: null,
      username: '',
      variant: 'danger',
    }
  },
  methods: {
    showModal(type) {
      this.username = `${this.item.firstName} ${this.item.lastName}`

      if (type === 'deleteUser') {
        this.variant = 'danger'
        this.modalTitle = this.$t('overlay.deleteUser.title')
        this.modalQuestion = this.$t('overlay.deleteUser.question', { username: this.username })
        this.modalOkTitle = this.$t('overlay.deleteUser.yes')
        this.modalEvent = this.deleteUser
      }

      if (type === 'undeleteUser') {
        this.variant = 'success'
        this.modalTitle = this.$t('overlay.undeleteUser.title')
        this.modalQuestion = this.$t('overlay.undeleteUser.question', { username: this.username })
        this.modalOkTitle = this.$t('overlay.undeleteUser.yes')
        this.modalEvent = this.unDeleteUser
      }
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
