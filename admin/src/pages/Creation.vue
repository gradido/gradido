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
import { searchUsers } from '../graphql/searchUsers'

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

        { key: 'firstName', label: 'Firstname' },
        { key: 'lastName', label: 'Lastname' },
        { key: 'creation', label: 'Creation' },
        { key: 'email', label: 'Email' },
      ],
      fields: [
        { key: 'email', label: 'Email' },
        { key: 'firstName', label: 'Firstname' },
        { key: 'lastName', label: 'Lastname' },
        { key: 'creation', label: 'Creation' },
        { key: 'bookmark', label: 'löschen' },
      ],
      itemsList: [],
      massCreation: [],
      radioSelectedMass: '',
      criteria: '',
      creation: [null, null, null],
    }
  },
  created() {
    this.getUsers()
  },
  methods: {
    getUsers() {
      this.$apollo
        .query({
          query: searchUsers,
          variables: {
            searchText: this.criteria,
          },
        })
        .then((result) => {
          this.itemsList = result.data.searchUsers.map((user) => {
            return {
              ...user,
              // showDetails: true,
            }
          })
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
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
