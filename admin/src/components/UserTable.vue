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
        <b-button variant="info" size="md" @click="row.toggleDetails" class="mr-2">
          <b-icon v-if="row.detailsShowing" icon="eye-slash-fill" aria-label="Help"></b-icon>
          <b-icon v-else icon="eye-fill" aria-label="Help"></b-icon>
        </b-button>
      </template>

      <template #row-details="row">
        <b-card class="shadow-lg p-3 mb-5 bg-white rounded">
          <b-row class="mb-2">
            <b-col></b-col>
          </b-row>

          <creation-formular
            type="singleCreation"
            :pagetype="type"
            :creation="row.item.creation"
            :item="row.item"
            :creationUserData="creationUserData"
            @update-creation-data="updateCreationData"
            @update-user-data="updateUserData"
          />

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
  },
  data() {
    return {
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
      alert('die schöpfung bestätigen und abschließen')
      alert(JSON.stringify(item))
      this.$emit('remove-confirm-result', item, 'remove')
    },
    editCreationUserTable(row, rowItem) {
      alert('editCreationUserTable')
      if (!row.detailsShowing) {
        alert('offen edit loslegen')
        // this.item = rowItem
        this.creationUserData = rowItem
        console.log('editCreationUserTable creationUserData', this.creationUserData)
      }
      row.toggleDetails()
    },
    updateCreationData(data) {
      this.creationUserData = {
        ...data,
      }
    },
    updateUserData(rowItem, newCreation) {
      rowItem.creation = newCreation
    },
  },
    watch: {
    creationUserData: function () {
      alert('yolo')
      console.log(this.creationUserData)
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
