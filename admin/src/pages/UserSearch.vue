<template>
  <div class="user-search">
    <div class="user-search-first-div">
      <BButton class="unconfirmedRegisterMails" variant="light" @click="unconfirmedRegisterMails">
        <IBiEnvelope style="color: #f5365c" />
        {{
          filters.byActivated === null
            ? $t('all_emails')
            : filters.byActivated === false
              ? $t('unregistered_emails')
              : ''
        }}
      </BButton>
      <BButton class="deletedUserSearch" variant="light" @click="deletedUserSearch">
        <IBiXCircle style="color: #f5365c" />
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
    <UserQuery v-model="criteria" class="mb-4 mt-2" />
    <SearchUserTable
      type="PageUserSearch"
      :items="searchResult"
      :fields="fields"
      @update-roles="updateRoles"
      @update-deleted-at="updateDeletedAt"
    />
    <BPagination
      v-model="currentPage"
      :per-page="perPage"
      :total-rows="rows"
      align="center"
      :hide-ellipsis="true"
      pills
      size="lg"
    />
  </div>
</template>
<script setup>
import { ref, reactive, computed, watch, watchEffect, onMounted } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import { searchUsers } from '../graphql/searchUsers.js'
import useCreationMonths from '../composables/useCreationMonths'
import SearchUserTable from '../components/Tables/SearchUserTable'
import UserQuery from '../components/UserQuery'
import { BPagination, BButton } from 'bootstrap-vue-next'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()

const searchResult = ref([])
const criteria = ref('')
const filters = reactive({
  byActivated: null,
  byDeleted: null,
})
const rows = ref(0)
const currentPage = ref(1)
const perPage = ref(25)
const response = ref()

const { creationLabel } = useCreationMonths()
const { toastSuccess } = useAppToast()
const route = useRoute()

const { result, refetch } = useQuery(searchUsers, {
  query: criteria.value,
  filters,
  currentPage: currentPage.value,
  pageSize: perPage.value,
  order: 'DESC',
  fetchPolicy: 'no-cache',
})
response.value = result.value

watchEffect(() => {
  if (result.value) {
    searchResult.value = result.value.searchUsers.userList
    rows.value = result.value.searchUsers.userCount
  }
})

const updateRoles = (userId, roles) => {
  searchResult.value.find((obj) => obj.userId === userId).roles = roles
}

const updateDeletedAt = (userId, deletedAt) => {
  searchResult.value.find((obj) => obj.userId === userId).deletedAt = deletedAt
  toastSuccess(deletedAt ? t('user_deleted') : t('user_recovered'))
}

const unconfirmedRegisterMails = () => {
  filters.byActivated = filters.byActivated === null ? false : null
  refetch()
}

const deletedUserSearch = () => {
  filters.byDeleted = filters.byDeleted === null ? true : null
  refetch()
}

onMounted(() => {
  const searchQuery = route.query.search
  if (searchQuery) {
    criteria.value = searchQuery
  }
})

const fields = computed(() => [
  { key: 'email', label: t('e_mail') },
  { key: 'firstName', label: t('firstname') },
  { key: 'lastName', label: t('lastname') },
  {
    key: 'creation',
    label: creationLabel(),
    formatter: (value, key, item) => {
      return value.join(' | ')
    },
  },
  { key: 'createdAt', label: t('registered_at') },
  // { key: 'show_details', label: t('details') },
  // { key: 'confirm_mail', label: t('confirmed') },
  // { key: 'has_elopage', label: 'elopage' },
  // { key: 'transactions_list', label: t('transaction') },
  { key: 'status', label: t('status') },
])

watch(
  () => currentPage.value,
  async (newValue, oldValue) => {
    if (newValue !== oldValue) {
      await refetch({
        query: criteria.value,
        filters,
        currentPage: newValue,
        pageSize: perPage.value,
        order: 'DESC',
        fetchPolicy: 'no-cache',
      })
    }
  },
)

watch(
  () => criteria.value,
  async (newValue, oldValue) => {
    if (newValue !== oldValue) {
      await refetch({
        query: newValue,
      })
    }
  },
)
</script>
<style scoped>
.user-search-first-div {
  text-align: right;
}

img,
svg {
  vertical-align: text-bottom;
}
</style>
