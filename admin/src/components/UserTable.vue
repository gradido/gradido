<template>
  <div class="componente-user-table">
    <b-table :items="itemsUser" :fields="fieldsTable" :filter="criteria" caption-top striped hover>
      <template #cell(show_details)="row">
        <b-button variant="info" size="sm" @click="row.toggleDetails" class="mr-2">
          {{ row.detailsShowing ? 'Hide' : 'Show' }} Details
        </b-button>
      </template>

      <template #row-details="row">
        <b-card>
          <b-row class="mb-2">
            <b-col>
              <h3>{{ row.item.first_name }} {{ row.item.last_name }}</h3>
            </b-col>
          </b-row>

          <creation-formular
            type="singleCreation"
            :creation="getCreationInMonths(row.item.creation)"
          />

          <b-button size="sm" @click="row.toggleDetails">Hide Details</b-button>
        </b-card>
      </template>

      <template #cell(bookmark)="row">
        <b-button
          variant="warning"
          v-show="type == 'UserListSearch'"
          size="sm"
          @click="bookmarkPush(row.item, row.index, $event.target)"
          class="mr-2"
        >
          merken
        </b-button>
        <b-button
          variant="danger"
          v-show="type == 'UserListMassCreation' || type == 'PageCreationConfirm'"
          size="sm"
          @click="bookmarkRemove(row.item, row.index, $event.target)"
          class="mr-2"
        >
          löschen
        </b-button>
        <b-button
          variant="success"
          v-show="type == 'PageCreationConfirm'"
          size="sm"
          @click="bookmarkConfirm(row.item, row.index, $event.target)"
          class="mr-2"
        >
          bestätigen
        </b-button>
      </template>
    </b-table>
  </div>
</template>

<script>
import CreationFormular from '../components/CreationFormular.vue'

export default {
  name: 'UserTable',
  props: ['type', 'itemsUser', 'fieldsTable', 'criteria', 'creation'],
  components: {
    CreationFormular,
  },
  data() {
    return {}
  },
  methods: {
    bookmarkPush(item, index, button) {
      // console.log('bookmarking item', item)
      // console.log('bookmarking index', index)
      // console.log('bookmarking button', button)

      this.$emit('update-item', item, 'push')
    },
    bookmarkRemove(item, index, button) {
      // console.log('bookmarking item', item)
      // console.log('bookmarking index', index)
      // console.log('bookmarking button', button)
      if (this.type === 'UserListMassCreation') {
        this.$emit('update-item', item, 'remove')
      }

      if (this.type === 'PageCreationConfirm') {
        this.$emit('update-confirm-result', item, 'remove')
      }
    },
    bookmarkConfirm(item, index, button) {
      alert('die schöpfung bestätigen und abschließen')
      alert(JSON.stringify(item))
      this.$emit('update-confirm-result', item, 'remove')
    },
    getCreationInMonths(creation) {
      // console.log('getCreationInMonths', creation)
      return creation.split(',')
    },
  },
}
</script>
