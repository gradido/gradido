<template>
  <div class="user-search">
    <div style="text-align: right">
      <b-button block variant="danger" @click="unconfirmedRegisterMails">
        <b-icon icon="envelope" variant="light"></b-icon>
        {{ $t('unregistered_emails') }}
      </b-button>
    </div>
    <label>{{ $t('user_search') }}</label>
    <b-input
      type="text"
      v-model="criteria"
      class="shadow p-3 mb-3 bg-white rounded"
      :placeholder="$t('user_search')"
      @input="getUsers"
    ></b-input>

    <user-table
      type="PageUserSearch"
      :itemsUser="searchResult"
      :fieldsTable="fields"
      :criteria="criteria"
    />
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
          label: this.$t('open_creation'),
          formatter: (value, key, item) => {
            return (
              `
            <div>` +
              this.$moment().subtract(2, 'month').format('MMMM') +
              ` - ` +
              String(value[0]) +
              ` GDD</div>
            <div>` +
              this.$moment().subtract(1, 'month').format('MMMM') +
              ` - ` +
              String(value[1]) +
              ` GDD</div>
            <div>` +
              this.$moment().format('MMMM') +
              ` - ` +
              String(value[2]) +
              ` GDD</div>
            `
            )
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
    }
  },

  methods: {
    unconfirmedRegisterMails() {
      this.searchResult = this.searchResult.filter((user) => {
        return user.emailChecked
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
          this.searchResult = result.data.searchUsers
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
