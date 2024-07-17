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
      selectableonRowSelected
      @row-clicked="onRowClicked"
    >
      <template #cell(creation)="data">
        <div v-html="data.value"></div>
      </template>

      <template #cell(status)="row">
        <div class="text-right">
          <BAvatar v-if="row.item.deletedAt" class="mr-3 test-deleted-icon" variant="light">
            <b-iconstack font-scale="2">
              <IBi0Circle />
              <b-icon stacked icon="slash-circle" variant="danger"></b-icon>
            </b-iconstack>
          </BAvatar>
          <span v-if="!row.item.deletedAt">
            <BAvatar
              v-if="!row.item.emailChecked"
              icon="envelope"
              class="align-center mr-3"
              variant="danger"
            ></BAvatar>

            <BAvatar
              v-if="!row.item.hasElopage"
              variant="danger"
              class="mr-3"
              src="img/elopage_favicon.png"
            ></BAvatar>
          </span>
          <b-icon
            variant="dark"
            :icon="row.detailsShowing ? 'caret-up-fill' : 'caret-down'"
            :title="row.item.enabled ? $t('enabled') : $t('deleted')"
          ></b-icon>
        </div>
      </template>

      <template #row-details="row">
        <BCard ref="rowDetails" class="shadow-lg pl-3 pr-3 mb-5 bg-white rounded">
          <BTabs content-class="mt-3">
            <BTab :title="$t('creation')" active :disabled="row.item.deletedAt !== null">
              <CreationFormular
                v-if="!row.item.deletedAt"
                pagetype="singleCreation"
                :creation="row.item.creation"
                :item="row.item"
                :creationUserData="creationUserData"
                @update-user-data="updateUserData"
              />
            </BTab>
            <BTab :title="$t('e_mail')" :disabled="row.item.deletedAt !== null">
              <ConfirmRegisterMailFormular
                v-if="!row.item.deletedAt"
                :checked="row.item.emailChecked"
                :email="row.item.email"
                :dateLastSend="
                  row.item.emailConfirmationSend
                    ? $d(new Date(row.item.emailConfirmationSend), 'long')
                    : ''
                "
              />
            </BTab>
            <BTab :title="$t('creationList')" :disabled="row.item.deletedAt !== null">
              <CreationTransactionList v-if="!row.item.deletedAt" :userId="row.item.userId" />
            </BTab>
            <BTab :title="$t('transactionlink.name')" :disabled="row.item.deletedAt !== null">
              <TransactionLinkList v-if="!row.item.deletedAt" :userId="row.item.userId" />
            </BTab>
            <BTab :title="$t('userRole.tabTitle')">
              <ChangeUserRoleFormular :item="row.item" @updateRoles="updateRoles" />
            </BTab>
            <BTab v-if="$store.state.moderator.roles.includes('ADMIN')" :title="$t('delete_user')">
              <DeletedUserFormular :item="row.item" @updateDeletedAt="updateDeletedAt" />
            </BTab>
          </BTabs>
        </BCard>
      </template>
    </BTable>
  </div>
</template>
<script setup>
import { ref, computed, nextTick } from 'vue'
import { BTable, BAvatar, BTab, BTabs, BCard } from 'bootstrap-vue-next'

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

const emit = defineEmits(['updateRoles', 'updateDeletedAt'])

const creationUserData = ref({})

const updateUserData = (rowItem, newCreation) => {
  rowItem.creation = newCreation
}

const updateRoles = ({ userId, roles }) => {
  emit('updateRoles', userId, roles)
}

const updateDeletedAt = ({ userId, deletedAt }) => {
  emit('updateDeletedAt', userId, deletedAt)
}

const onRowClicked = async (item) => {
  const status = myItems.value.find((obj) => obj === item)._showDetails
  myItems.value.forEach((obj) => {
    if (obj === item) {
      obj._showDetails = !status
    } else {
      obj._showDetails = false
    }
  })
  await nextTick()
  if (!status && rowDetails.value) {
    rowDetails.value.focus()
  }
}

const myItems = computed(() => {
  return props.items.map((item) => {
    return { ...item, _showDetails: false }
  })
})
</script>
