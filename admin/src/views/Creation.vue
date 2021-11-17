<template>
  <div>
    <b-row>
      <b-col>
        <div>UserListe zum auswählen (itemsList)</div>
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
      <b-col class="shadow p-3 mb-5 rounded bg-info">
        <div>UserListe zum schöpfen (massCreation)</div>
        <creation-formular
          type="massCreation"
          :creation="creation"
          @update-radio-selected="updateRadioSelected"
        />
        <user-table
          class="shadow p-3 mb-5 bg-white rounded"
          type="UserListMassCreation"
          :itemsUser="massCreation"
          :fieldsTable="fields"
          :criteria="null"
          :creation="creation"
          @update-item="updateItem"
        />
      </b-col>
    </b-row>
    <hr />
    Schöpfen
    <ul>
      <li>radioSelectedMass = {{ radioSelectedMass }}</li>
      <li>Tabelle Creationen</li>
    </ul>
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
        { key: 'email', label: 'Email' },
        { key: 'first_name', label: 'Firstname' },
        { key: 'last_name', label: 'Lastname' },
        { key: 'creation', label: 'Creation' },
        { key: 'bookmark', label: 'Bookmark' },
      ],
      fields: [
        { key: 'email', label: 'Email' },
        { key: 'first_name', label: 'Firstname' },
        { key: 'last_name', label: 'Lastname' },
        { key: 'creation', label: 'Creation' },
        { key: 'show_details', label: 'Details' },
        { key: 'bookmark', label: 'Bookmark' },
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
    // updateMassCreation(newMassCreationItem, even) {
    //  console.log('even', even)
    //  console.log('>>>>>>>>>>>>>>>>  newMassCreationItem overview: ', newMassCreationItem)
    //  this.massCreation.push(newMassCreationItem)
    // },
    // getSearchResult() {
    //  console.log('setSearchResult')
    //  this.itemsList = this.searchResult
    // },

    updateItem(e, event) {
      // console.log('even', even)
      // console.log('>>>>>>>>>>>>>>>> updateItem e: ', e)

      let index = 0
      let findArr = {}

      // console.log("array1.find((arr) => arr.id === 2).text ", array1.find((arr) => arr.id === 2))

      // console.log('this.massCreation bevor: ', this.massCreation)
      if (event === 'push') {
        findArr = this.itemsList.find((arr) => arr.id === e.id)

        // console.log('findArr ', findArr)

        index = this.itemsList.indexOf(findArr)

        // console.log('index ', index)

        this.itemsList.splice(index, 1)

        // console.log(this.itemsList)

        this.massCreation.push(e)
      }
      if (event === 'remove') {
        findArr = this.massCreation.find((arr) => arr.id === e.id)

        // console.log('findArr ', findArr)

        index = this.massCreation.indexOf(findArr)

        // console.log('index ', index)

        this.massCreation.splice(index, 1)

        // console.log(this.massCreation)

        this.itemsList.push(e)
      }
      // console.log('this.massCreation after: ', this.massCreation)

      // console.log('this items after', this.items)
    },

    updateRadioSelected(obj) {
      // console.log('Creation.vue updateRadioSelected', obj)
      this.radioSelectedMass = obj[0]
    },
  },
}
</script>
