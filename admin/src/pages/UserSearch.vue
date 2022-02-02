<template>
  <div class="user-search">
    <div style="text-align: right">
      <b-button block variant="danger" @click="unconfirmedRegisterMails">
        <b-icon icon="envelope" variant="light"></b-icon>
        {{ filterCheckedEmails ? $t('all_emails') : $t('unregistered_emails') }}
      </b-button>
    </div>
    <label>{{ $t('user_search') }}</label>
    <b-input
      type="text"
      v-model="criteria"
      class="shadow p-3 mb-3 bg-white rounded"
      :placeholder="$t('user_search')"
    ></b-input>
    <user-table
      type="PageUserSearch"
      :itemsUser="searchResult"
      :fieldsTable="fields"
      :criteria="criteria"
    />
    <b-pagination
      pills
      size="lg"
      v-model="currentPage"
      per-page="perPage"
      :total-rows="rows"
      align="center"
    ></b-pagination>
    <div></div>
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'
import { searchUsers } from '../graphql/searchUsers'
import { creationMonths } from '../mixins/creationMonths'

export default {
  name: 'UserSearch',
  mixins: [creationMonths],
  components: {
    UserTable,
  },
  data() {
    return {
      showArrays: false,
      searchResult: [],
      massCreation: [],
      criteria: '',
      filterCheckedEmails: false,
      rows: 0,
      currentPage: 1,
      perPage: 25,
      now: Date.now(),
    }
  },
  methods: {
    unconfirmedRegisterMails() {
      this.filterCheckedEmails = !this.filterCheckedEmails
      this.getUsers()
    },
    getUsers() {
      this.$apollo
        .query({
          query: searchUsers,
          variables: {
            searchText: this.criteria,
            currentPage: this.currentPage,
            pageSize: this.perPage,
            notActivated: this.filterCheckedEmails,
          },
        })
        .then((result) => {
          this.rows = result.data.searchUsers.userCount
          this.searchResult = result.data.searchUsers.userList
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
  watch: {
    currentPage() {
      this.getUsers()
    },
    criteria() {
      this.getUsers()
    },
  },
  computed: {
    fields() {
      return [
        { key: 'email', label: this.$t('e_mail') },
        { key: 'firstName', label: this.$t('firstname') },
        { key: 'lastName', label: this.$t('lastname') },
        {
          key: 'creation',
          label: this.creationLabel,
        },
        { key: 'show_details', label: this.$t('details') },
        { key: 'confirm_mail', label: this.$t('confirmed') },
        { key: 'transactions_list', label: this.$t('transaction') },
      ]
    },
  },
  created() {
    this.getUsers()
  },
}
</script>
