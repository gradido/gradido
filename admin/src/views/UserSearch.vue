<template>
  <div class="user-search">
    <label>Usersuche</label>
    <b-input
      type="text"
      v-model="criteria"
      class="shadow p-3 mb-5 bg-white rounded"
      placeholder="User suche"
      @input="getUsers"
    ></b-input>
    <user-table
      type="PageUserSearch"
      :itemsUser="searchResult"
      :fieldsTable="fields"
      :criteria="criteria"
    />
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'
import { searchUsers } from '../graphql/searchUsers'

export default {
  name: 'overview',
  components: {
    UserTable,
  },
  data() {
    return {
      showArrays: false,
      fields: [
        { key: 'email', label: 'Email' },
        { key: 'firstName', label: 'Firstname' },
        { key: 'lastName', label: 'Lastname' },
        { key: 'creation', label: 'Creation' },
        { key: 'show_details', label: 'Details' },
      ],
      searchResult: [],
      massCreation: [],
      criteria: '',
    }
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
          this.searchResult = result.data.searchUsers.map((user) => {
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
  },
  created() {
    this.getUsers()
  },
}
</script>
