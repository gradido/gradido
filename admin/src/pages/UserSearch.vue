<template>
  <div class="user-search">
    <div class="user-search-first-div">
      <BButton class="unconfirmedRegisterMails" variant="light" @click="unconfirmedRegisterMails">
        <IBi0Circle />
        {{
          filters.byActivated === null
            ? $t('all_emails')
            : filters.byActivated === false
            ? $t('unregistered_emails')
            : ''
        }}
      </BButton>
      <BButton class="deletedUserSearch" variant="light" @click="deletedUserSearch">
        <b-icon icon="x-circle" variant="danger"></b-icon>
        {{
          filters.byDeleted === null
            ? $t('all_emails')
            : filters.byDeleted === true
            ? $t('deleted_user')
            : ''
        }}
      </BButton>
    </div>
    <label>{{ $t('user_search') }}</label>
    <UserQuery class="mb-4 mt-2" v-model="criteria" />
    <SearchUserTable
      type="PageUserSearch"
      :items="searchResult"
      :fields="fields"
      @updateRoles="updateRoles"
      @updateDeletedAt="updateDeletedAt"
    />
    <BPagination
      pills
      size="lg"
      v-model="currentPage"
      :per-page="perPage"
      :total-rows="rows"
      align="center"
      :hide-ellipsis="true"
    ></BPagination>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { searchUsers } from '../graphql/searchUsers'
import useCreationMonths from '../composables/useCreationMonths'
import { useApolloClient } from '@vue/apollo-composable'
import SearchUserTable from '../components/Tables/SearchUserTable'
import UserQuery from '../components/UserQuery'
import { BPagination, BButton } from 'bootstrap-vue-next'
import IBi0Circle from '~icons/bi/0-circle'

const searchResult = ref([])
const criteria = ref('')
const filters = reactive({
  byActivated: null,
  byDeleted: null,
})
const rows = ref(0)
const currentPage = ref(1)
const perPage = ref(25)

const { creationLabel } = useCreationMonths()

const apollo = useApolloClient()

const getUsers = async () => {
  try {
    const result = await apollo.query({
      query: searchUsers,
      variables: {
        query: this.criteria,
        filters: this.filters,
        currentPage: this.currentPage,
        pageSize: this.perPage,
        order: 'DESC',
      },
      fetchPolicy: 'no-cache',
    })
    rows.value = result.data.searchUsers.userCount
    searchResult.value = result.data.searchUsers.userList
  } catch (error) {
    toastError(error.message)
  }
}

const unconfirmedRegisterMails = () => {
  filters.byActivated = filters.byActivated === null ? false : null
  getUsers()
}

const deletedUserSearch = () => {
  filters.byDeleted = filters.byDeleted === null ? true : null
  getUsers()
}

const fields = computed(() => [
  // { key: 'email', label: $t('e_mail') },
  // { key: 'firstName', label: $t('firstname') },
  // { key: 'lastName', label: $t('lastname') },
  {
    key: 'creation',
    label: creationLabel,
    formatter: (value, key, item) => {
      return value.join(' | ')
    },
  },
  // { key: 'show_details', label: $t('details') },
  // { key: 'confirm_mail', label: $t('confirmed') },
  // { key: 'has_elopage', label: 'elopage' },
  // { key: 'transactions_list', label: $t('transaction') },
  // { key: 'status', label: this.$t('status') },
])

watch(currentPage, getUsers)
watch(criteria, getUsers)

onMounted(getUsers)
</script>
<style scoped>
.user-search-first-div {
  text-align: right;
}
</style>
