<template>
  <div class="component-user-table">
    <div v-show="overlay" id="overlay" class="">
      <b-jumbotron class="bg-light p-4">
        <template #header>{{ overlayText.header }}</template>

        <template #lead>
          {{ overlayText.text1 }}
        </template>

        <hr class="my-4" />

        <p>
          {{ overlayText.text2 }}
        </p>

        <b-button size="md" variant="danger" class="m-3" @click="overlayCancel">
          {{ overlayText.button_cancel }}
        </b-button>
        <b-button
          size="md"
          variant="success"
          class="m-3 text-right"
          @click="overlayOK(overlayBookmarkType, overlayItem)"
        >
          {{ overlayText.button_ok }}
        </b-button>
      </b-jumbotron>
    </div>
    <b-table-lite
      :items="itemsUser"
      :fields="fieldsTable"
      :filter="criteria"
      caption-top
      striped
      hover
      stacked="md"
    >
      <template #cell(creation)="data">
        <div v-html="data.value"></div>
      </template>

      <template #cell(edit_creation)="row">
        <b-button variant="info" size="md" @click="rowToogleDetails(row, 0)" class="mr-2">
          <b-icon :icon="row.detailsShowing ? 'x' : 'pencil-square'" aria-label="Help"></b-icon>
        </b-button>
      </template>

      <template #cell(show_details)="row">
        <b-button variant="info" size="md" @click="rowToogleDetails(row, 0)" class="mr-2">
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

      <template #cell(transactions_list)="row">
        <b-button variant="warning" size="md" @click="rowToogleDetails(row, 2)" class="mr-2">
          <b-icon icon="list"></b-icon>
        </b-button>
      </template>

      <template #row-details="row">
        <row-details
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
              :email="row.item.email"
              :dateLastSend="$moment().subtract(1, 'month').format('dddd, DD.MMMM.YYYY HH:mm'),"
            />
          </template>
          <template #show-transaction-list>
            <creation-transaction-list-formular :userId="row.item.userId" />
          </template>
        </row-details>
      </template>
      <template #cell(bookmark)="row">
        <b-button
          variant="warning"
          v-show="type === 'UserListSearch'"
          size="md"
          @click="bookmarkPush(row.item)"
          class="mr-2"
        >
          <b-icon icon="plus" variant="success"></b-icon>
        </b-button>
        <b-button
          variant="danger"
          v-show="type === 'UserListMassCreation' || type === 'PageCreationConfirm'"
          size="md"
          @click="overlayShow('remove', row.item)"
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
          @click="overlayShow('confirm', row.item)"
          class="mr-2"
        >
          <b-icon icon="check" scale="2" variant=""></b-icon>
        </b-button>
      </template>
    </b-table-lite>
  </div>
</template>

<script>
import CreationFormular from '../components/CreationFormular.vue'
import EditCreationFormular from '../components/EditCreationFormular.vue'
import ConfirmRegisterMailFormular from '../components/ConfirmRegisterMailFormular.vue'
import CreationTransactionListFormular from '../components/CreationTransactionListFormular.vue'
import RowDetails from '../components/RowDetails.vue'

import { confirmPendingCreation } from '../graphql/confirmPendingCreation'

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
    criteria: {
      type: String,
      required: false,
      default: '',
    },
    creation: {
      type: Array,
      required: false,
    },
  },
  components: {
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
      overlayBookmarkType: '',
      overlayItem: [],
      overlayText: [
        {
          header: '-',
          text1: '--',
          text2: '---',
          button_ok: 'OK',
          button_cancel: 'Cancel',
        },
      ],
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
    overlayShow(bookmarkType, item) {
      this.overlay = true
      this.overlayBookmarkType = bookmarkType
      this.overlayItem = item

      if (bookmarkType === 'remove') {
        this.overlayText.header = this.$t('overlay.remove.title')
        this.overlayText.text1 = this.$t('overlay.remove.text')
        this.overlayText.text2 = this.$t('overlay.remove.question')
        this.overlayText.button_ok = this.$t('overlay.remove.yes')
        this.overlayText.button_cancel = this.$t('overlay.remove.no')
      }
      if (bookmarkType === 'confirm') {
        this.overlayText.header = this.$t('overlay.confirm.title')
        this.overlayText.text1 = this.$t('overlay.confirm.text')
        this.overlayText.text2 = this.$t('overlay.confirm.question')
        this.overlayText.button_ok = this.$t('overlay.confirm.yes')
        this.overlayText.button_cancel = this.$t('overlay.confirm.no')
      }
    },
    overlayOK(bookmarkType, item) {
      if (bookmarkType === 'remove') {
        this.bookmarkRemove(item)
      }
      if (bookmarkType === 'confirm') {
        this.bookmarkConfirm(item)
      }
      this.overlay = false
    },
    overlayCancel() {
      this.overlay = false
    },
    bookmarkPush(item) {
      this.$emit('update-item', item, 'push')
    },
    bookmarkRemove(item) {
      if (this.type === 'UserListMassCreation') {
        this.$emit('update-item', item, 'remove')
      }

      if (this.type === 'PageCreationConfirm') {
        this.$emit('remove-confirm-result', item, 'remove')
      }
    },
    bookmarkConfirm(item) {
      this.$apollo
        .mutate({
          mutation: confirmPendingCreation,
          variables: {
            id: item.id,
          },
        })
        .then(() => {
          this.$emit('remove-confirm-result', item, 'confirmed')
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
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
