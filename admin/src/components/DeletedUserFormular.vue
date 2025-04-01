<template>
  <div class="deleted-user-formular">
    <div v-if="isUserModerator" class="mt-5 mb-5">
      {{ $t('removeNotSelf') }}
    </div>
    <div v-else class="mt-5">
      <div class="mt-3 mb-5">
        <BButton
          v-if="!item.deletedAt"
          v-b-modal.delete-user-modal
          variant="danger"
          @click="showDeleteModal"
        >
          {{ $t('delete_user') }}
        </BButton>
        <BButton v-else v-b-modal.delete-user-modal variant="success" @click="showUndeleteModal">
          {{ $t('undelete_user') }}
        </BButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useApolloClient } from '@vue/apollo-composable'
import { BButton, vBModal } from 'bootstrap-vue-next'
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update-deleted-at', 'show-delete-modal', 'show-undelete-modal'])

const { client } = useApolloClient()
const store = useStore()
const { toastError } = useAppToast()

const isUserModerator = computed(() => props.item.userId === store.state.moderator.id)

const showDeleteModal = () => {
  emit('show-delete-modal')
}

const showUndeleteModal = () => {
  emit('show-undelete-modal')
}

const deleteUserMutation = async () => {
  try {
    const result = await client.mutate({
      mutation: deleteUser,
      variables: {
        userId: props.item.userId,
      },
    })
    emit('update-deleted-at', {
      userId: props.item.userId,
      deletedAt: result.data.deleteUser,
    })
  } catch (error) {
    toastError(error.message)
  }
}

const undeleteUserMutation = async () => {
  try {
    const result = await client.mutate({
      mutation: unDeleteUser,
      variables: {
        userId: props.item.userId,
      },
    })
    emit('update-deleted-at', {
      userId: props.item.userId,
      deletedAt: result.data.unDeleteUser,
    })
  } catch (error) {
    toastError(error.message)
  }
}

defineExpose({ deleteUserMutation, undeleteUserMutation })
</script>

<style>
.input-group-text {
  background-color: rgb(255 252 205);
}
</style>
