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
          <b-avatar v-if="row.item.deletedAt" class="mr-3" variant="light">
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
          <creation-formular
            v-if="!row.item.deletedAt"
            type="singleCreation"
            pagetype="singleCreation"
            :creation="row.item.creation"
            :item="row.item"
            :creationUserData="creationUserData"
            @update-user-data="updateUserData"
          />
          <div v-else>{{ $t('userIsDeleted') }}</div>
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
          <creation-transaction-list-formular
            v-if="!row.item.deletedAt"
            :userId="row.item.userId"
          />
          <links-transaction-list-formular :userId="row.item.userId" />

          <deleted-user-formular :item="row.item" @updateDeletedAt="updateDeletedAt" />
        </b-card>
      </template>
    </b-table>
  </div>
</template>
<script>
import CreationFormular from '../CreationFormular.vue'
import ConfirmRegisterMailFormular from '../ConfirmRegisterMailFormular.vue'
import CreationTransactionListFormular from '../CreationTransactionListFormular.vue'
import LinksTransactionListFormular from '../LinksTransactionListFormular.vue'
import DeletedUserFormular from '../DeletedUserFormular.vue'

export default {
  name: 'SearchUserTable',
  components: {
    CreationFormular,
    ConfirmRegisterMailFormular,
    CreationTransactionListFormular,
    LinksTransactionListFormular,
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
