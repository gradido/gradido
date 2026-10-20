// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { BButton, vBModal } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { useAdminStore } from '@/store/useAdminStore'
import { isTheModerator } from '@/utils/theModerator'
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'
import './DeletedUserFormular.css'

type DeletableUser = {
  userId: number
  gradidoID?: string
  communityUuid?: string
  deletedAt?: string | Date | null
}

export const DeletedUserFormular = defineComponent({
  name: 'DeletedUserFormular',
  props: {
    item: {
      type: Object as PropType<DeletableUser>,
      required: true,
    },
  },
  emits: ['update-deleted-at', 'show-delete-modal', 'show-undelete-modal'],
  setup(props, { emit, expose }) {
    const { t } = useI18n()
    const { client } = useApolloClient()
    const store = useAdminStore()
    const { toastError } = useAppToast()

    const isUserModerator = computed(() => isTheModerator(store.moderator, props.item))

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
        toastError((error as Error).message)
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
        toastError((error as Error).message)
      }
    }

    expose({ deleteUserMutation, undeleteUserMutation })

    return () => (
      <div class='deleted-user-formular'>
        {isUserModerator.value ? (
          <div class='mt-5 mb-5'>{t('removeNotSelf')}</div>
        ) : (
          <div class='mt-5'>
            <div class='mt-3 mb-5'>
              {!props.item.deletedAt
                ? withDirectives(
                    <BButton variant='danger' onClick={showDeleteModal}>
                      {t('delete_user')}
                    </BButton>,
                    // v-b-modal.delete-user-modal: the modal's id is the directive's modifier
                    [[vBModal, undefined, undefined, { 'delete-user-modal': true }]],
                  )
                : withDirectives(
                    <BButton variant='success' onClick={showUndeleteModal}>
                      {t('undelete_user')}
                    </BButton>,
                    // v-b-modal.delete-user-modal: the modal's id is the directive's modifier
                    [[vBModal, undefined, undefined, { 'delete-user-modal': true }]],
                  )}
            </div>
          </div>
        )}
      </div>
    )
  },
})
