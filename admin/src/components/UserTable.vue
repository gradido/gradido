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
      <template #cell(edit_creation)="row">
        <b-button
          variant="info"
          size="md"
          @click="editCreationUserTable(row, row.item)"
          class="mr-2"
        >
          <b-icon v-if="row.detailsShowing" icon="x" aria-label="Help"></b-icon>
          <b-icon v-else icon="pencil-square" aria-label="Help"></b-icon>
        </b-button>
      </template>

      <template #cell(show_details)="row">
        <b-button
          variant="info"
          size="md"
          :ref="'showing_detals_' + row.detailsShowing"
          @click="rowDetailsToogle(row, row.detailsShowing)"
          class="mr-2"
        >
          <b-icon v-if="row.detailsShowing" icon="eye-slash-fill" aria-label="Help"></b-icon>
          <b-icon v-else icon="eye-fill" aria-label="Help"></b-icon>
        </b-button>
      </template>

      <template #cell(confirm_mail)="row">
        <b-button
          :variant="row.item.firstName === 'Peter' ? 'success' : 'danger'"
          size="md"
          :ref="'showing_registermail_detals_' + row.detailsShowing"
          @click="
            row.item.firstName !== 'Peter'
              ? rowDetailsToogleRegisterMail(row, row.detailsShowing)
              : ''
          "
          class="mr-2"
        >
          <b-icon
            :icon="row.item.firstName === 'Peter' ? 'envelope-open' : 'envelope'"
            aria-label="Help"
          ></b-icon>
        </b-button>
      </template>

      <template #row-details="row">
        <b-card class="shadow-lg p-3 mb-5 bg-white rounded">
          <b-row class="mb-2">
            <b-col></b-col>
          </b-row>
          {{ type }}
          <div v-if="showCreationFormular">
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
          <confirm-register-mail-formular />

          <b-button size="sm" @click="row.toggleDetails">
            <b-icon
              :icon="type === 'PageCreationConfirm' ? 'x' : 'eye-slash-fill'"
              aria-label="Help"
            ></b-icon>
            Details verbergen von {{ row.item.firstName }} {{ row.item.lastName }}
          </b-button>
        </b-card>
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
import { confirmPendingCreation } from '../graphql/confirmPendingCreation'

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
  },
  data() {
    return {
      showCreationFormular: null,
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
    }
  },
  methods: {
    rowDetailsToogle(row, details) {
      if (details) {
        row.toggleDetails()
        this.showCreationFormular = null
      }
      if (!details) {
        row.toggleDetails()
        this.showCreationFormular = true
        if (this.$refs.showing_detals_true !== undefined) {
          this.$refs.showing_detals_true.click()
        }
      }
    },

    rowDetailsToogleRegisterMail(row, details) {
      if (this.showCreationFormular === true) {
        this.showCreationFormular = false
        return
      }
      if (details) {
        row.toggleDetails()
        this.showCreationFormular === null
      }
      if (!details) {
        row.toggleDetails()
        this.showCreationFormular === false
        if (this.$refs.showing_registermail_detals_true !== undefined) {
          this.$refs.showing_registermail_detals_true.click()
        }
      }
    },
    overlayShow(bookmarkType, item) {
      this.overlay = true
      this.overlayBookmarkType = bookmarkType
      this.overlayItem = item

      if (bookmarkType === 'remove') {
        this.overlayText.header = 'Achtung! Schöpfung löschen!'
        this.overlayText.text1 =
          'Nach dem Löschen gibt es keine Möglichkeit mehr diesen Datensatz wiederherzustellen. Es wird aber der gesamte Vorgang in der Logdatei als Übersicht gespeichert.'
        this.overlayText.text2 = 'Willst du die vorgespeicherte Schöpfung wirklich löschen? '
        this.overlayText.button_ok = 'Ja, Schöpfung löschen!'
        this.overlayText.button_cancel = 'Nein, nicht löschen.'
      }
      if (bookmarkType === 'confirm') {
        this.overlayText.header = 'Schöpfung bestätigen!'
        this.overlayText.text1 =
          'Nach dem Speichern ist der Datensatz nicht mehr änderbar und kann auch nicht mehr gelöscht werden. Bitte überprüfe genau, dass alles stimmt.'
        this.overlayText.text2 =
          'Willst du diese vorgespeicherte Schöpfung wirklich vollziehen und entgültig speichern?'
        this.overlayText.button_ok = 'Ja, Schöpfung speichern und bestätigen!'
        this.overlayText.button_cancel = 'Nein, nicht speichern.'
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
          this.$emit('remove-confirm-result', item, 'remove')
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    editCreationUserTable(row, rowItem) {
      if (!row.detailsShowing) {
        this.creationUserData = rowItem
      } else {
        this.creationUserData = {}
      }
      row.toggleDetails()
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
