<template>
  <div class="creation">
    <b-row>
      <b-col cols="12" lg="6">
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
          @push-item="pushItem"
        />
        <b-pagination
          pills
          v-model="currentPage"
          per-page="perPage"
          :total-rows="rows"
          align="center"
        ></b-pagination>
      </b-col>
      <b-col cols="12" lg="6" class="shadow p-3 mb-5 rounded bg-info">
        <user-table
          v-show="itemsMassCreation.length > 0"
          class="shadow p-3 mb-5 bg-white rounded"
          type="UserListMassCreation"
          :itemsUser="itemsMassCreation"
          :fieldsTable="fields"
          :criteria="null"
          :creation="creation"
          @remove-item="removeItem"
        />
        <div v-if="itemsMassCreation.length === 0">
          {{ $t('multiple_creation_text') }}
        </div>
        <creation-formular
          v-else
          type="massCreation"
          :creation="creation"
          :items="itemsMassCreation"
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
  name: 'Creation',
  components: {
    CreationFormular,
    UserTable,
  },
  data() {
    return {
      showArrays: false,
      itemsList: [],
      itemsMassCreation: this.$store.state.userSelectedInMassCreation,
      radioSelectedMass: '',
      criteria: '',
      creation: [null, null, null],
      rows: 0,
      currentPage: 1,
      perPage: 25,
      now: Date.now(),
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
            currentPage: this.currentPage,
            pageSize: this.perPage,
          },
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.rows = result.data.searchUsers.userCount
          this.itemsList = result.data.searchUsers.userList.map((user) => {
            return {
              ...user,
              showDetails: false,
            }
          })
          if (this.itemsMassCreation.length !== 0) {
            const selectedIndices = this.itemsMassCreation.map((item) => item.userId)
            this.itemsList = this.itemsList.filter((item) => !selectedIndices.includes(item.userId))
          }
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    pushItem(selectedItem) {
      this.itemsMassCreation = [
        this.itemsList.find((item) => selectedItem.userId === item.userId),
        ...this.itemsMassCreation,
      ]
      this.itemsList = this.itemsList.filter((item) => selectedItem.userId !== item.userId)
      this.$store.commit('setUserSelectedInMassCreation', this.itemsMassCreation)
    },
    removeItem(selectedItem) {
      this.itemsList = [
        this.itemsMassCreation.find((item) => selectedItem.userId === item.userId),
        ...this.itemsList,
      ]
      this.itemsMassCreation = this.itemsMassCreation.filter(
        (item) => selectedItem.userId !== item.userId,
      )
      this.$store.commit('setUserSelectedInMassCreation', this.itemsMassCreation)
    },
    removeAllBookmark() {
      this.itemsMassCreation = []
      this.$store.commit('setUserSelectedInMassCreation', [])
      this.getUsers()
    },
  },
  computed: {
    Searchfields() {
      return [
        { key: 'bookmark', label: 'bookmark' },
        { key: 'firstName', label: this.$t('firstname') },
        { key: 'lastName', label: this.$t('lastname') },
        {
          key: 'creation',
          label: this.creationLabel,
          formatter: (value, key, item) => {
            return value.join(' | ')
          },
        },
        { key: 'email', label: this.$t('e_mail') },
      ]
    },
    fields() {
      return [
        { key: 'email', label: this.$t('e_mail') },
        { key: 'firstName', label: this.$t('firstname') },
        { key: 'lastName', label: this.$t('lastname') },
        {
          key: 'creation',
          label: this.creationLabel,
          formatter: (value, key, item) => {
            return value.join(' | ')
          },
        },
        { key: 'bookmark', label: this.$t('remove') },
      ]
    },
    creationLabel() {
      const now = new Date(this.now)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const beforeLastMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      return [
        this.$d(beforeLastMonth, 'monthShort'),
        this.$d(lastMonth, 'monthShort'),
        this.$d(now, 'monthShort'),
      ].join(' | ')
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
}
</script>
