<template>
  <div class="search-user-table">
    <b-table-lite :items="items" :fields="fields" caption-top striped hover stacked="md">
      <template #cell(creation)="data">
        <div v-html="data.value" @click="rowToogleDetails(row, 0)"></div>
      </template>

      <template #cell(status)="row">
        <div @click="rowToogleDetails(row, 0)" class="text-right">
          <b-table-simple fixed-width small>
            <b-tr>
              <b-td>
                <b-badge v-if="!row.item.emailChecked" variant="danger" class="mr-2">
                  <b-icon class="h4" icon="envelope" aria-label="Help"></b-icon>
                </b-badge>
              </b-td>
              <b-td>
                <b-badge v-if="!row.item.hasElopage" variant="danger" class="mr-2">
                  <b-icon class="h4" icon="x-circle"></b-icon>
                </b-badge>
              </b-td>
              <b-td>
                <b-icon
                  variant="dark"
                  :icon="row.detailsShowing ? 'caret-up-fill' : 'caret-down'"
                  :title="row.item.enabled ? $t('enabled') : $t('deleted')"
                ></b-icon>
              </b-td>
            </b-tr>
          </b-table-simple>
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
          <template #show-collaps>
            <creation-formular
              type="singleCreation"
              pagetype="singleCreation"
              :creation="row.item.creation"
              :item="row.item"
              :creationUserData="creationUserData"
              @update-user-data="updateUserData"
            />
            <confirm-register-mail-formular
              :checked="row.item.emailChecked"
              :email="row.item.email"
              :dateLastSend="
                row.item.emailConfirmationSend
                  ? $d(new Date(row.item.emailConfirmationSend), 'long')
                  : ''
              "
            />
            <creation-transaction-list-formular :userId="row.item.userId" />
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

const slotNames = ['show-collaps']

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
