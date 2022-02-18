<template>
  <div class="search-user-table">
    <b-table-lite :items="items" :fields="fields" caption-top striped hover stacked="md">
      <template #cell(creation)="data">
        <div v-html="data.value"></div>
      </template>
      <template #cell(enabled)="row">
        <b-icon
          @click="rowToogleDetails(row, 3)"
          :variant="row.item.enabled ? 'dark' : 'dark'"
          :icon="row.item.enabled ? 'gear' : 'gear'"
          :title="row.item.enabled ? $t('enabled') : $t('disabled')"
        ></b-icon>
      </template>
      <template #cell(show_details)="row">
        <b-button
          variant="info"
          size="md"
          v-if="row.item.emailChecked"
          @click="rowToogleDetails(row, 0)"
          class="mr-2"
        >
          <b-icon :icon="row.detailsShowing ? 'eye-slash-fill' : 'eye-fill'"></b-icon>
        </b-button>
      </template>
      <template #cell(confirm_mail)="row">
        <b-button
          :variant="row.item.emailChecked ? 'success' : 'danger'"
          size="md"
          @click="rowToogleDetails(row, 1)"
          class="mr-2"
        >
          <b-icon
            :icon="row.item.emailChecked ? 'envelope-open' : 'envelope'"
            aria-label="Help"
          ></b-icon>
        </b-button>
      </template>
      <template #cell(has_elopage)="row">
        <b-icon
          :variant="row.item.hasElopage ? 'success' : 'danger'"
          :icon="row.item.hasElopage ? 'check-circle' : 'x-circle'"
        ></b-icon>
      </template>
      <template #cell(transactions_list)="row">
        <b-button variant="warning" size="md" @click="rowToogleDetails(row, 2)" class="mr-2">
          <b-icon icon="list"></b-icon>
        </b-button>
      </template>
      <template #row-details="row">
        <row-details
          :row="row"
          type="singleCreation"
          :slotName="slotName"
          :index="slotIndex"
          @row-toogle-details="rowToogleDetails"
        >
          <template #show-creation>
            <div>
              <creation-formular
                type="singleCreation"
                pagetype="singleCreation"
                :creation="row.item.creation"
                :item="row.item"
                :creationUserData="creationUserData"
                @update-user-data="updateUserData"
              />
            </div>
          </template>
          <template #show-register-mail>
            <confirm-register-mail-formular
              :checked="row.item.emailChecked"
              :email="row.item.email"
              :dateLastSend="
                row.item.emailConfirmationSend
                  ? $d(new Date(row.item.emailConfirmationSend), 'long')
                  : ''
              "
            />
          </template>
          <template #show-transaction-list>
            <creation-transaction-list-formular :userId="row.item.userId" />
          </template>
          <template #show-deleted-user>
            <deleted-user-formular :item="row.item" />
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

const slotNames = [
  'show-creation',
  'show-register-mail',
  'show-transaction-list',
  'show-deleted-user',
]

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
  },
  computed: {
    slotName() {
      return slotNames[this.slotIndex]
    },
  },
}
</script>
