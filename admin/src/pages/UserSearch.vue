<template>
  <div class="user-search">
    <label>Usersuche</label>
    <b-input
      type="text"
      v-model="criteria"
      class="shadow p-3 mb-3 bg-white rounded"
      placeholder="User suche"
      @input="getUsers"
    ></b-input>

    <user-table
      type="PageUserSearch"
      :itemsUser="searchResult"
      :fieldsTable="fields"
      :criteria="criteria"
    />
    <div>
      <b-button block variant="danger" @click="unconfirmedRegisterMails">
        <b-icon icon="envelope" variant="light"></b-icon>
        Anzeigen aller nicht registrierten E-Mails.
      </b-button>
    </div>
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'
import { searchUsers } from '../graphql/searchUsers'
import { searchNotActivatedUsers } from '../graphql/searchNotActivatedUsers'

export default {
  name: 'UserSearch',
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
        {
          key: 'creation',
          label: 'Creation',
          formatter: (value, key, item) => {
            return String(value)
          },
        },
        { key: 'show_details', label: 'Details' },
        { key: 'confirm_mail', label: 'Mail' },
        { key: 'transactions_list', label: 'Transaction' },
      ],
      searchResult: [],
      massCreation: [],
      criteria: '',
    }
  },

  methods: {
    unconfirmedRegisterMails() {
      this.searchResult = this.searchResult.filter((result) => {
        return !result.emailChecked
      })
    },
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
