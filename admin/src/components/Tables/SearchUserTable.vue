<template>
  <div class="search-user-table">
    <b-table
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
          <b-avatar v-if="row.item.deletedAt" class="mr-3 test-deleted-icon" variant="light">
            <b-iconstack font-scale="2">
              <b-icon stacked icon="person" variant="info" scale="0.75"></b-icon>
              <b-icon stacked icon="slash-circle" variant="danger"></b-icon>
            </b-iconstack>
          </b-avatar>
          <span v-if="!row.item.deletedAt">
            <b-avatar
              v-if="!row.item.emailChecked"
              icon="envelope"
              class="align-center mr-3"
              variant="danger"
            ></b-avatar>

            <b-avatar
              v-if="!row.item.hasElopage"
              variant="danger"
              class="mr-3"
              src="img/elopage_favicon.png"
            ></b-avatar>
          </span>
          <b-icon
            variant="dark"
            :icon="row.detailsShowing ? 'caret-up-fill' : 'caret-down'"
            :title="row.item.enabled ? $t('enabled') : $t('deleted')"
          ></b-icon>
        </div>
      </template>

      <template #row-details="row">
        <b-card ref="rowDetails" class="shadow-lg pl-3 pr-3 mb-5 bg-white rounded">
          <b-tabs content-class="mt-3">
            <b-tab :title="$t('creation')" active :disabled="row.item.deletedAt !== null">
              <creation-formular
                v-if="!row.item.deletedAt"
                pagetype="singleCreation"
                :creation="row.item.creation"
                :item="row.item"
                :creationUserData="creationUserData"
                @update-user-data="updateUserData"
              />
            </b-tab>
            <b-tab :title="$t('e_mail')" :disabled="row.item.deletedAt !== null">
              <confirm-register-mail-formular
                v-if="!row.item.deletedAt"
                :checked="row.item.emailChecked"
                :email="row.item.email"
                :dateLastSend="
                  row.item.emailConfirmationSend
                    ? $d(new Date(row.item.emailConfirmationSend), 'long')
                    : ''
                "
              />
            </b-tab>
            <b-tab :title="$t('creationList')" :disabled="row.item.deletedAt !== null">
              <creation-transaction-list v-if="!row.item.deletedAt" :userId="row.item.userId" />
            </b-tab>
            <b-tab :title="$t('transactionlink.name')" :disabled="row.item.deletedAt !== null">
              <transaction-link-list v-if="!row.item.deletedAt" :userId="row.item.userId" />
            </b-tab>
            <b-tab :title="$t('userRole.tabTitle')">
              <change-user-role-formular :item="row.item" @updateIsAdmin="updateIsAdmin" />
            </b-tab>
            <b-tab :title="$t('delete_user')">
              <deleted-user-formular :item="row.item" @updateDeletedAt="updateDeletedAt" />
            </b-tab>
          </b-tabs>
        </b-card>
      </template>
    </b-table>
  </div>
</template>
<script>
import CreationFormular from '../CreationFormular.vue'
import ConfirmRegisterMailFormular from '../ConfirmRegisterMailFormular.vue'
import CreationTransactionList from '../CreationTransactionList.vue'
import TransactionLinkList from '../TransactionLinkList.vue'
import ChangeUserRoleFormular from '../ChangeUserRoleFormular.vue'
import DeletedUserFormular from '../DeletedUserFormular.vue'

export default {
  name: 'SearchUserTable',
  components: {
    CreationFormular,
    ConfirmRegisterMailFormular,
    CreationTransactionList,
    TransactionLinkList,
    ChangeUserRoleFormular,
    DeletedUserFormular,
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
    fields: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      creationUserData: {},
    }
  },
  methods: {
    updateUserData(rowItem, newCreation) {
      rowItem.creation = newCreation
    },
    updateIsAdmin({ userId, isAdmin }) {
      this.$emit('updateIsAdmin', userId, isAdmin)
    },
    updateDeletedAt({ userId, deletedAt }) {
      this.$emit('updateDeletedAt', userId, deletedAt)
    },
    async onRowClicked(item) {
      const status = this.myItems.find((obj) => obj === item)._showDetails
      this.myItems.forEach((obj) => {
        if (obj === item) {
          obj._showDetails = !status
        } else {
          obj._showDetails = false
        }
      })
      await this.$nextTick()
      if (!status && this.$refs.rowDetails) {
        this.$refs.rowDetails.focus()
      }
    },
  },
  computed: {
    myItems() {
      return this.items.map((item) => {
        return { ...item, _showDetails: false }
      })
    },
  },
}
</script>
