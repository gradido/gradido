<template>
  <div class="search-user-table">
    <b-table-lite :items="items" :fields="fields" caption-top striped hover stacked="md">
      <template #cell(creation)="data">
        <div v-html="data.value"></div>
      </template>

      <template #cell(status)="row">
        <div @click="rowToogleDetails(row, 0)" class="text-right">
          <b-avatar v-if="row.item.deletedAt" class="mr-3" variant="light">
            <b-iconstack font-scale="2">
              <b-icon stacked icon="person" variant="info" scale="0.75"></b-icon>
              <b-icon stacked icon="slash-circle" variant="danger"></b-icon>
            </b-iconstack>
          </b-avatar>
          <span v-if="!row.item.deletedAt">
            <b-avatar
              v-if="!row.item.emailChecked"
              href="#baz"
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
        <row-details
          :row="row"
          type="singleCreation"
          :slotName="slotName"
          :index="slotIndex"
          @row-toogle-details="rowToogleDetails"
        >
          <template #show-collapse>
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
            <deleted-user-formular :item="row.item" @updateDeletedAt="updateDeletedAt" />
          </template>
        </row-details>
      </template>
    </b-table-lite>
  </div>
</template>
<script>
import CreationFormular from '../CreationFormular.vue'
import ConfirmRegisterMailFormular from '../ConfirmRegisterMailFormular.vue'
import RowDetails from '../RowDetails.vue'
import CreationTransactionListFormular from '../CreationTransactionListFormular.vue'
import DeletedUserFormular from '../DeletedUserFormular.vue'
import { toggleRowDetails } from '../../mixins/toggleRowDetails'

const slotNames = ['show-collapse']

export default {
  name: 'SearchUserTable',
  mixins: [toggleRowDetails],
  components: {
    CreationFormular,
    ConfirmRegisterMailFormular,
    CreationTransactionListFormular,
    DeletedUserFormular,
    RowDetails,
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
  },
  computed: {
    slotName() {
      return slotNames[this.slotIndex]
    },
  },
}
</script>
