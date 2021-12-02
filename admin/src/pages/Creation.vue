<template>
  <div class="creation">
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
          v-if="itemsList.length > 0"
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
          v-show="itemsMassCreation.length > 0"
          class="shadow p-3 mb-5 bg-white rounded"
          type="UserListMassCreation"
          :itemsUser="itemsMassCreation"
          :fieldsTable="fields"
          :criteria="null"
          :creation="creation"
          @update-item="updateItem"
        />
        <div v-if="itemsMassCreation.length === 0">
          Bitte wähle ein oder Mehrere Mitglieder aus für die du Schöpfen möchtest
        </div>
        <creation-formular
          v-else
          type="massCreation"
          :creation="creation"
          :items="itemsMassCreation"
          @remove-all-bookmark="removeAllBookmark"
        />
        {{ itemsMassCreation }}
      </b-col>
    </b-row>
  </div>
</template>
<script>
import CreationFormular from '../components/CreationFormular.vue'
import UserTable from '../components/UserTable.vue'
import { searchUsers } from '../graphql/searchUsers'

export default {
  name: 'Creation',
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
      itemsMassCreation: [],
      radioSelectedMass: '',
      criteria: '',
      creation: [null, null, null],
    }
  },
  async created() {
    await this.getUsers()
  },
  methods: {
    async getUsers() {
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
              showDetails: false,
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
          this.itemsMassCreation.push(e)
          break
        case 'remove':
          findArr = this.itemsMassCreation.find((arr) => arr.id === e.id)
          index = this.itemsMassCreation.indexOf(findArr)
          this.itemsMassCreation.splice(index, 1)
          this.itemsList.push(e)
          break
        default:
          throw new Error(event)
      }
    },

    // updateRadioSelected(obj) {
    //  this.radioSelectedMass = obj[0]
    // },

    removeAllBookmark() {
      alert('remove all bookmarks')
      const index = 0
      let i = 0

      for (i; i < this.itemsMassCreation.length; i++) {
        this.itemsList.push(this.itemsMassCreation[i])
      }
      this.itemsMassCreation.splice(index, this.itemsMassCreation.length)
    },
  },
}
</script>
