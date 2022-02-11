<template>
  <div class="component-user-table">
    <div v-show="overlay" id="overlay" @dblclick="overlayCancel">
      <overlay :items="overlayItem" @overlay-cancel="overlayCancel" @overlay-ok="overlayOK" />
    </div>
    <b-table-lite :items="itemsUser" :fields="fieldsTable" caption-top striped hover stacked="md">
      <template #cell(creation)="data">
        <div v-html="data.value"></div>
      </template>

      <template #cell(edit_creation)="row">
        <b-button variant="info" size="md" @click="rowToogleDetails(row, 0)" class="mr-2">
          <b-icon :icon="row.detailsShowing ? 'x' : 'pencil-square'" aria-label="Help"></b-icon>
        </b-button>
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
          v-if="type !== 'UserListSearch' && type !== 'UserListMassCreation'"
          :row="row"
          :type="type"
          :slotName="slotName"
          :index="slotIndex"
          @row-toogle-details="rowToogleDetails"
        >
          <template #show-creation>
            <div>
              <creation-formular
                v-if="type === 'PageUserSearch'"
                type="singleCreation"
                :pagetype="type"
                :creation="row.item.creation"
                :item="row.item"
                :creationUserData="creationUserData"
                @update-creation-data="updateCreationData"
                @update-user-data="updateUserData"
              />
              <edit-creation-formular
                v-else
                type="singleCreation"
                :pagetype="type"
                :creation="row.item.creation"
                :item="row.item"
                :row="row"
                :creationUserData="creationUserData"
                @update-creation-data="updateCreationData"
                @update-user-data="updateUserData"
              />
            </div>
          </template>
          <template #show-register-mail>
            <confirm-register-mail-formular
              :checked="row.item.emailChecked"
              :email="row.item.email"
              :dateLastSend="$d(new Date(), 'long')"
            />
          </template>
          <template #show-transaction-list>
            <creation-transaction-list-formular :userId="row.item.userId" />
          </template>
        </row-details>
      </template>
      <template #cell(bookmark)="row">
        <div v-if="type === 'UserListSearch'">
          <b-button
            v-if="row.item.emailChecked"
            variant="warning"
            size="md"
            @click="bookmarkPush(row.item)"
            class="mr-2"
          >
            <b-icon icon="plus" variant="success"></b-icon>
          </b-button>
          <div v-else>{{ $t('e_mail') }}!</div>
        </div>
        <b-button
          variant="danger"
          v-show="type === 'UserListMassCreation' || type === 'PageCreationConfirm'"
          size="md"
          @click="bookmarkRemove(row.item)"
          class="mr-2"
        >
          <b-icon icon="x" variant="light"></b-icon>
        </b-button>
      </template>

      <template #cell(confirm)="row">
        <b-button
          variant="success"
          v-show="type === 'PageCreationConfirm'"
          size="md"
          @click="overlayShow(row.item)"
          class="mr-2"
        >
          <b-icon icon="check" scale="2" variant=""></b-icon>
        </b-button>
      </template>
    </b-table-lite>
  </div>
</template>

<script>
import Overlay from '../components/Overlay.vue'
import CreationFormular from '../components/CreationFormular.vue'
import EditCreationFormular from '../components/EditCreationFormular.vue'
import ConfirmRegisterMailFormular from '../components/ConfirmRegisterMailFormular.vue'
import CreationTransactionListFormular from '../components/CreationTransactionListFormular.vue'
import RowDetails from '../components/RowDetails.vue'

const slotNames = ['show-creation', 'show-register-mail', 'show-transaction-list']

export default {
  name: 'UserTable',
  props: {
    type: {
      type: String,
      required: true,
    },
    itemsUser: {
      type: Array,
      required: true,
    },
    fieldsTable: {
      type: Array,
      required: true,
    },
  },
  components: {
    Overlay,
    CreationFormular,
    EditCreationFormular,
    ConfirmRegisterMailFormular,
    CreationTransactionListFormular,
    RowDetails,
  },
  data() {
    return {
      showCreationFormular: null,
      showConfirmRegisterMailFormular: null,
      showCreationTransactionListFormular: null,
      creationUserData: {},
      overlay: false,
      overlayItem: {},
      slotIndex: 0,
      openRow: null,
    }
  },
  methods: {
    rowToogleDetails(row, index) {
      if (this.openRow) {
        if (this.openRow.index === row.index) {
          if (index === this.slotIndex) {
            row.toggleDetails()
            this.openRow = null
          } else {
            this.slotIndex = index
          }
        } else {
          this.openRow.toggleDetails()
          row.toggleDetails()
          this.slotIndex = index
          this.openRow = row
          if (this.type === 'PageCreationConfirm') {
            this.creationUserData = row.item
          }
        }
      } else {
        row.toggleDetails()
        this.slotIndex = index
        this.openRow = row
        if (this.type === 'PageCreationConfirm') {
          this.creationUserData = row.item
        }
      }
    },
    overlayShow(item) {
      this.overlay = true
      this.overlayItem = item
    },
    overlayOK(item) {
      this.$emit('confirm-creation', item)
      this.overlay = false
    },
    overlayCancel() {
      this.overlay = false
    },
    bookmarkPush(item) {
      this.$emit('push-item', item)
    },
    bookmarkRemove(item) {
      if (this.type === 'UserListMassCreation') {
        this.$emit('remove-item', item)
      }

      if (this.type === 'PageCreationConfirm') {
        this.$emit('remove-creation', item)
      }
    },
    updateCreationData(data) {
      this.creationUserData.amount = data.amount
      this.creationUserData.date = data.date
      this.creationUserData.memo = data.memo
      this.creationUserData.moderator = data.moderator

      data.row.toggleDetails()
    },
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
<style>
#overlay {
  position: fixed;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-left: 5%;
  background-color: rgba(12, 11, 11, 0.781);
  z-index: 1000000;
  cursor: pointer;
}
</style>
