<template>
  <div class="search-user-table">
    <BTable
      tbody-tr-class="pointer"
      :items="myItems"
      :fields="fields"
      caption-top
      striped
      hover
      stacked="md"
      select-mode="single"
      selectable-on-row-selected
      @row-clicked="onRowClicked"
    >
      <template #cell(creation)="data">
        <div v-html="data.value" />
      </template>

      <template #cell(createdAt)="data">
        {{ $d(new Date(data.value), 'long') }}
      </template>

      <template #cell(status)="row">
        <div class="d-flex gap-3 justify-content-end align-items-center">
          <div
            v-if="row.item.deletedAt"
            class="me-3 test-deleted-icon position-relative rounded-circle"
            style="width: 40px; height: 40px"
          >
            <img src="../../assets/icons/circle-slash.png" class="position-absolute" />
            <img
              src="../../assets/icons/person.png"
              class="position-relative"
              style="transform: translate(50%, 30%)"
            />
          </div>
          <span v-if="!row.item.deletedAt" class="d-flex gap-2">
            <div
              v-if="!row.item.emailChecked"
              class="me-3 rounded-circle position-relative"
              style="background-color: #dc3545; width: 40px; height: 40px"
            >
              <img
                src="../../assets/icons/envelope.png"
                style="transform: translate(30%, 30%); width: 25px; height: 25px"
                class="position-absolute"
              />
            </div>
            <div>
              <img
                v-if="!row.item.hasElopage"
                class="me-3 rounded-circle bg-red-dark"
                src="../../assets/icons/elopage_favicon.png"
                style="background-color: #dc3545; width: 40px; height: 40px"
              />
            </div>
          </span>
          <IPhCaretUpFill
            v-if="row.detailsShowing === 'caret-up-fill'"
            style="color: #212529"
            :title="row.item.enabled ? $t('enabled') : $t('deleted')"
          />
          <IPhCaretDown
            v-else
            style="color: #212529"
            :title="row.item.enabled ? $t('enabled') : $t('deleted')"
          />
        </div>
      </template>

      <template #row-details="row">
        <BCard ref="rowDetails" class="shadow-lg ps-3 pe-3 mb-5 bg-white rounded">
          <BTabs content-class="mt-3">
            <BTab :title="$t('creation')" active :disabled="row.item.deletedAt !== null">
              <creation-formular
                v-if="!row.item.deletedAt"
                pagetype="singleCreation"
                :creation="row.item.creation"
                :item="row.item"
                :creation-user-data="creationUserData"
                @update-user-data="updateUserData"
              />
            </BTab>
            <BTab :title="$t('e_mail')" :disabled="row.item.deletedAt !== null">
              <confirm-register-mail-formular
                v-if="!row.item.deletedAt"
                :checked="row.item.emailChecked"
                :email="row.item.email"
                :date-last-send="
                  row.item.emailConfirmationSend
                    ? $d(new Date(row.item.emailConfirmationSend), 'long')
                    : ''
                "
              />
            </BTab>
            <BTab :title="$t('creationList')" :disabled="row.item.deletedAt !== null">
              <creation-transaction-list v-if="!row.item.deletedAt" :user-id="row.item.userId" />
            </BTab>
            <BTab :title="$t('transactionlink.name')" :disabled="row.item.deletedAt !== null">
              <transaction-link-list v-if="!row.item.deletedAt" :user-id="row.item.userId" />
            </BTab>
            <BTab :title="$t('userRole.tabTitle')">
              <change-user-role-formular
                ref="userChangeForm"
                :item="row.item"
                @update-roles="updateRoles"
                @show-modal="showModal"
              />
            </BTab>
            <BTab v-if="store.state.moderator.roles.includes('ADMIN')" :title="$t('delete_user')">
              <deleted-user-formular
                v-if="!row.item.deletedAt"
                ref="deletedUserForm"
                :item="row.item"
                @update-deleted-at="updateDeletedAt"
                @show-delete-modal="showDeleteModal"
              />
              <deleted-user-formular
                v-else
                ref="undeletedUserForm"
                :item="row.item"
                @show-undelete-modal="showUndeleteModal"
              />
            </BTab>
          </BTabs>
        </BCard>
      </template>
    </BTable>
  </div>
</template>
<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { BTable, BTab, BTabs, BCard, useModalController } from 'bootstrap-vue-next'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import CreationFormular from '../CreationFormular.vue'
import ConfirmRegisterMailFormular from '../ConfirmRegisterMailFormular.vue'
import CreationTransactionList from '../CreationTransactionList.vue'
import TransactionLinkList from '../TransactionLinkList.vue'
import ChangeUserRoleFormular from '../ChangeUserRoleFormular.vue'
import DeletedUserFormular from '../DeletedUserFormular.vue'

const { t } = useI18n()
const { confirm } = useModalController()
const store = useStore()
const { toastError, toastSuccess } = useAppToast()

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  fields: {
    type: Array,
    required: true,
  },
})

const rolesValues = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MODERATOR_AI: 'MODERATOR_AI',
  USER: 'USER',
}

const userChangeForm = ref()
const deletedUserForm = ref()
const undeletedUserForm = ref()
const myItems = ref()
const creationUserData = ref({})
const rowDetails = ref()

const userRoleChangeConfirmationBody = computed(() => {
  let roleLabel = ''
  switch (userChangeForm.value.roleSelected) {
    case rolesValues.ADMIN:
      roleLabel = t('userRole.selectRoles.admin')
      break
    case rolesValues.MODERATOR:
      roleLabel = t('userRole.selectRoles.moderator')
      break
    case rolesValues.MODERATOR_AI:
      roleLabel = t('userRole.selectRoles.moderatorAi')
      break
    default:
      roleLabel = t('userRole.selectRoles.user')
      break
  }
  return t('overlay.changeUserRole.question', {
    username: `${selectedRow.value.firstName} ${selectedRow.value.lastName}`,
    newRole: roleLabel,
  })
})

const showModal = async () => {
  await confirm?.({
    props: {
      cancelTitle: t('overlay.cancel'),
      centered: true,
      hideHeaderClose: true,
      title: t('overlay.changeUserRole.title'),
      okTitle: t('overlay.changeUserRole.yes'),
      okVariant: 'danger',
      body: userRoleChangeConfirmationBody.value,
    },
  })
    .then((ok) => {
      if (ok) {
        userChangeForm.value.updateUserRole(
          userChangeForm.value.roleSelected,
          userChangeForm.value.currentRole,
        )
      }
    })
    .catch((error) => {
      toastError(error.message)
    })
}

const showDeleteModal = async () => {
  await confirm?.({
    props: {
      cancelTitle: t('overlay.cancel'),
      centered: true,
      hideHeaderClose: true,
      title: t('overlay.deleteUser.title'),
      okTitle: t('overlay.deleteUser.yes'),
      okVariant: 'danger',
      static: true,
      body: t('overlay.deleteUser.question', {
        username: `${selectedRow.value.firstName} ${selectedRow.value.lastName}`,
      }),
    },
  })
    .then((ok) => {
      if (ok) {
        deletedUserForm.value.deleteUserMutation()
      }
    })

    .catch((error) => {
      toastError(error.message)
    })
}

const showUndeleteModal = async () => {
  await confirm?.({
    props: {
      cancelTitle: t('overlay.cancel'),
      centered: true,
      hideHeaderClose: true,
      title: t('overlay.undeleteUser.title'),
      okTitle: t('overlay.undeleteUser.yes'),
      okVariant: 'success',
      body: t('overlay.undeleteUser.question', {
        username: `${selectedRow.value.firstName} ${selectedRow.value.lastName}`,
      }),
    },
  })
    .then((ok) => {
      if (ok) {
        undeletedUserForm.value.undeleteUserMutation()
        toastSuccess(t('user_recovered'))
      }
    })
    .catch((error) => {
      toastError(error.message)
    })
}

const updateUserData = (rowItem, newCreation) => {
  rowItem.creation = newCreation
}

const updateRoles = ({ userId, roles }) => {
  emit('update-roles', userId, roles)
}

const updateDeletedAt = ({ userId, deletedAt }) => {
  emit('update-deleted-at', userId, deletedAt)
}

const emit = defineEmits(['update-roles', 'update-deleted-at'])

const selectedRow = computed(() => {
  return myItems.value.find((obj) => obj._showDetails)
})

const onRowClicked = async (item) => {
  const status = myItems.value.find((obj) => {
    return obj?.userId === item?.userId
  })?._showDetails

  myItems.value.forEach((obj) => {
    if (obj === item) {
      obj._showDetails = !status
    } else {
      obj._showDetails = false
    }
  })
  await nextTick()
}

watch(
  () => props.items,
  (items) => {
    myItems.value = items.map((item) => {
      return { ...item, _showDetails: false }
    })
  },
  { immediate: true },
)
</script>
