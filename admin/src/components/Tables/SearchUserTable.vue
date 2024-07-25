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

      <template #cell(status)="row">
        <div class="text-right">
          <BAvatar v-if="row.item.deletedAt" class="mr-3 test-deleted-icon" variant="light">
            <!-- <b-iconstack font-scale="2"> -->
            <div>
              <IOcticonPerson24 />
              <IOcticonCircleSlash24 style="color: #f5365c" />
            </div>
            <!-- </b-iconstack> -->
          </BAvatar>
          <span v-if="!row.item.deletedAt">
            <IPhEnvelope
              v-if="!row.item.emailChecked"
              style="color: #f5365c"
              class="align-center mr-3"
            />
            <!-- <BAvatar
              v-if="!row.item.hasElopage"
              variant="danger"
              class="mr-3"
              src="img/elopage_favicon.png"
            /> -->
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
        <BCard ref="rowDetails" class="shadow-lg pl-3 pr-3 mb-5 bg-white rounded">
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
                :item="row.item"
                @update-deleted-at="updateDeletedAt"
                @show-delete-modal="showDeleteModal"
              />
            </BTab>
          </BTabs>
        </BCard>
      </template>
    </BTable>
  </div>
</template>
<script setup>
import { ref, nextTick, onMounted, watch, computed } from 'vue'
import {
  BTable,
  BAvatar,
  BTab,
  BTabs,
  BCard,
  useModal,
  useModalController,
} from 'bootstrap-vue-next'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import CreationFormular from '../CreationFormular.vue'
import ConfirmRegisterMailFormular from '../ConfirmRegisterMailFormular.vue'
import CreationTransactionList from '../CreationTransactionList.vue'
import TransactionLinkList from '../TransactionLinkList.vue'
import ChangeUserRoleFormular from '../ChangeUserRoleFormular.vue'

const store = useStore()
const { toastError } = useAppToast()

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

const { t } = useI18n()
const rolesValues = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  USER: 'USER',
}
const { confirm } = useModalController()
const modal = useModal()
const userChangeForm = ref()

const showModal = async () => {
  const value = await confirm?.({
    props: {
      cancelTitle: t('overlay.cancel'),
      centered: true,
      hideHeaderClose: true,
      title: t('overlay.changeUserRole.title'),
      okTitle: t('overlay.changeUserRole.yes'),
      okVariant: 'danger',
      body: t('overlay.changeUserRole.question', {
        username: `${selectedRow.value.firstName} ${selectedRow.value.lastName}`,
        newRole:
          userChangeForm.value.roleSelected === rolesValues.ADMIN
            ? t('userRole.selectRoles.admin')
            : userChangeForm.value.roleSelected === rolesValues.MODERATOR
              ? t('userRole.selectRoles.moderator')
              : t('userRole.selectRoles.user'),
      }),
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

  modal.show?.({ props: { title: `Promise resolved to ${value}`, variant: 'info' } })
}

const showDeleteModal = async () => {
  const value = await confirm?.({ props: { title: 'Hello World! ' } })

  modal.show?.({ props: { title: `Promise resolved to ${value}`, variant: 'info' } })
}

const myItems = ref()
const creationUserData = ref({})
const rowDetails = ref()

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
    return obj.userId === item.userId
  })?._showDetails

  myItems.value.forEach((obj) => {
    if (obj === item) {
      obj._showDetails = !status
    } else {
      obj._showDetails = false
    }
  })

  await nextTick()
  if (!status && rowDetails.value) {
    // rowDetails.value.focus()
  }
}

watch(
  () => props.items,
  (items) => {
    myItems.value = items.map((item) => {
      return { ...item, _showDetails: false }
    })
  },
)

onMounted(() => {
  setTimeout(() => {
    myItems.value = props.items.map((item) => {
      return { ...item, _showDetails: false }
    })
  }, 500)
})
</script>
