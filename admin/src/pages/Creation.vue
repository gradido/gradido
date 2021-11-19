<template>
  <div>
    <b-row>
      <b-col cols="12" lg="5">
        <label>Usersuche</label>
        <b-input
          type="text"
          v-model="criteria"
          class="shadow p-3 mb-5 bg-white rounded"
          placeholder="User suche"
        ></b-input>
        <user-table
          type="UserListSearch"
          :itemsUser="itemsList"
          :fieldsTable="Searchfields"
          :criteria="criteria"
          :creation="creation"
          @update-item="updateItem"
        />
      </b-col>
      <b-col cols="12" lg="7" class="shadow p-3 mb-5 rounded bg-info">
        <user-table
          v-show="Object.keys(this.massCreation).length > 0"
          class="shadow p-3 mb-5 bg-white rounded"
          type="UserListMassCreation"
          :itemsUser="massCreation"
          :fieldsTable="fields"
          :criteria="null"
          :creation="creation"
          @update-item="updateItem"
        />

        <creation-formular
          type="massCreation"
          :creation="creation"
          :itemsMassCreation="massCreation"
          @update-radio-selected="updateRadioSelected"
          @remove-all-bookmark="removeAllBookmark"
        />
      </b-col>
    </b-row>
  </div>
</template>
<script>
import CreationFormular from '../components/CreationFormular.vue'
import UserTable from '../components/UserTable.vue'

export default {
  name: 'overview',
  components: {
    CreationFormular,
    UserTable,
  },
  data() {
    return {
      showArrays: false,
      Searchfields: [
        { key: 'bookmark', label: 'merken' },

        { key: 'first_name', label: 'Firstname' },
        { key: 'last_name', label: 'Lastname' },
        { key: 'creation', label: 'Creation' },
        { key: 'email', label: 'Email' },
      ],
      fields: [
        { key: 'email', label: 'Email' },
        { key: 'first_name', label: 'Firstname' },
        { key: 'last_name', label: 'Lastname' },
        { key: 'creation', label: 'Creation' },
        { key: 'bookmark', label: 'löschen' },
      ],
      searchResult: [
        {
          id: 1,
          email: 'dickerson@web.de',
          first_name: 'Dickerson',
          last_name: 'Macdonald',
          creation: '450,200,700',
        },
        {
          id: 2,
          email: 'larsen@woob.de',
          first_name: 'Larsen',
          last_name: 'Shaw',
          creation: '300,200,1000',
        },
        {
          id: 3,
          email: 'geneva@tete.de',
          first_name: 'Geneva',
          last_name: 'Wilson',
          creation: '350,200,900',
        },
        {
          id: 4,
          email: 'viewrter@asdfvb.com',
          first_name: 'Soledare',
          last_name: 'Takker',
          creation: '100,400,800',
        },
      ],
      itemsList: this.searchResult,
      massCreation: [],
      radioSelectedMass: '',
      criteria: '',
      creation: [null, null, null],
    }
  },
  created() {
    this.itemsList = this.searchResult
  },
  methods: {
    updateItem(e, event) {
      let index = 0
      let findArr = {}

      switch (event) {
        case 'push':
          findArr = this.itemsList.find((arr) => arr.id === e.id)
          index = this.itemsList.indexOf(findArr)
          this.itemsList.splice(index, 1)
          this.massCreation.push(e)
          break
        case 'remove':
          findArr = this.massCreation.find((arr) => arr.id === e.id)
          index = this.massCreation.indexOf(findArr)
          this.massCreation.splice(index, 1)
          this.itemsList.push(e)
          break
        default:
          throw new Error(event)
      }
    },

    updateRadioSelected(obj) {
      this.radioSelectedMass = obj[0]
    },

    removeAllBookmark() {
      alert('remove all bookmarks')
      const index = 0
      let i = 0

      for (i; i < this.massCreation.length; i++) {
        this.itemsList.push(this.massCreation[i])
      }
      this.massCreation.splice(index, this.massCreation.length)
    },
  },
}
</script>
