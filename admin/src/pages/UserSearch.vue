<template>
  <div class="user-search">
    <div style="text-align: right">
      <b-button block variant="danger" @click="unconfirmedRegisterMails">
        <b-icon icon="envelope" variant="light"></b-icon>
        {{ filterCheckedEmails ? $t('all_emails') : $t('unregistered_emails') }}
      </b-button>
    </div>
    <label>{{ $t('user_search') }}</label>
    <div>
      <b-input-group>
        <b-form-input
          type="text"
          class="test-input-criteria"
          v-model="criteria"
          :placeholder="$t('user_search')"
        ></b-form-input>

        <b-input-group-append class="test-click-clear-criteria" @click="criteria = ''">
          <b-input-group-text>
            <b-icon icon="x" />
          </b-input-group-text>
        </b-input-group-append>
      </b-input-group>
    </div>

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

export default {
  name: 'UserSearch',
  components: {
    UserTable,
  },
  data() {
    return {
      showArrays: false,
      fields: [
        { key: 'email', label: this.$t('e_mail') },
        { key: 'firstName', label: this.$t('firstname') },
        { key: 'lastName', label: this.$t('lastname') },
        {
          key: 'creation',
          label: [
            this.$moment().subtract(2, 'month').format('MMM'),
            this.$moment().subtract(1, 'month').format('MMM'),
            this.$moment().format('MMM'),
          ].join(' | '),
          formatter: (value, key, item) => {
            return value.join(' | ')
          },
        },
        { key: 'show_details', label: this.$t('details') },
        { key: 'confirm_mail', label: this.$t('confirmed') },
        { key: 'transactions_list', label: this.$t('transaction') },
      ],
      searchResult: [],
      massCreation: [],
      criteria: '',
      currentMonth: {
        short: this.$moment().format('MMMM'),
      },
      lastMonth: {
        short: this.$moment().subtract(1, 'month').format('MMMM'),
      },
      beforeLastMonth: {
        short: this.$moment().subtract(2, 'month').format('MMMM'),
      },
      filterCheckedEmails: false,
      rows: 0,
      currentPage: 1,
      perPage: 25,
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
  created() {
    this.getUsers()
  },
}
</script>
