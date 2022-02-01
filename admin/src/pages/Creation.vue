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
          @update-item="updateItem"
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
          v-show="$store.state.userSelectedInMassCreation.length > 0"
          class="shadow p-3 mb-5 bg-white rounded"
          type="UserListMassCreation"
          :itemsUser="itemsMassCreationReverse"
          :fieldsTable="fields"
          :criteria="null"
          :creation="creation"
          @update-item="updateItem"
        />
        <div v-if="$store.state.userSelectedInMassCreation.length === 0">
          {{ $t('multiple_creation_text') }}
        </div>
        <creation-formular
          v-else
          type="massCreation"
          :creation="creation"
          :items="$store.state.userSelectedInMassCreation"
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
      Searchfields: [
        { key: 'bookmark', label: 'bookmark' },
        { key: 'firstName', label: this.$t('firstname') },
        { key: 'lastName', label: this.$t('lastname') },
        {
          key: 'creation',
          // label: this.$t('open_creation') + 'Jan | Feb | März',
          label:
            this.$moment().subtract(2, 'month').format('MMM') +
            ' | ' +
            this.$moment().subtract(1, 'month').format('MMM') +
            ' | ' +
            this.$moment().format('MMM'),
          formatter: (value, key, item) => {
            return String(value[0]) + ` | ` + String(value[1]) + ` |  ` + String(value[2])
          },
        },
        { key: 'email', label: this.$t('e_mail') },
      ],
      fields: [
        { key: 'email', label: this.$t('e_mail') },
        { key: 'firstName', label: this.$t('firstname') },
        { key: 'lastName', label: this.$t('lastname') },
        {
          key: 'creation',
          // label: this.$t('open_creation') + 'Jan | Feb | März',
          label:
            this.$moment().subtract(2, 'month').format('MMM') +
            ' | ' +
            this.$moment().subtract(1, 'month').format('MMM') +
            ' | ' +
            this.$moment().format('MMM'),
          formatter: (value, key, item) => {
            return String(value[0]) + ` | ` + String(value[1]) + ` |  ` + String(value[2])
          },
        },
        { key: 'bookmark', label: this.$t('remove') },
      ],
      itemsList: [],
      itemsMassCreationReverse: [],
      radioSelectedMass: '',
      criteria: '',
      creation: [null, null, null],
      rows: 0,
      currentPage: 1,
      perPage: 25,
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
          this.updateItem(this.$store.state.userSelectedInMassCreation, 'mounted')
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    updateItem(e, event) {
      let index = 0
      let findArr = {}
      const letItemList = this.$store.state.userSelectedInMassCreation

      switch (event) {
        case 'push':
          findArr = this.itemsList.find((item) => e.userId === item.userId)
          index = this.itemsList.indexOf(findArr)
          this.itemsList.splice(index, 1)
          letItemList.push(findArr)
          break
        case 'remove':
          findArr = letItemList.find((item) => e.userId === item.userId)
          index = letItemList.indexOf(findArr)
          letItemList.splice(index, 1)
          this.itemsList.push(findArr)
          break
        case 'mounted':
          if (this.$store.state.userSelectedInMassCreation === []) return
          letItemList.forEach((value, key) => {
            findArr = this.itemsList.find((item) => value.userId === item.userId)
            index = this.itemsList.indexOf(findArr)
            this.itemsList.splice(index, 1)
          })
          break
        default:
          throw new Error(event)
      }
      this.lala = letItemList
      this.itemsMassCreationReverse = letItemList
      this.itemsMassCreationReverse.reverse()
      this.$store.commit('setUserSelectedInMassCreation', letItemList)
    },
    removeAllBookmark() {
      this.$store.commit('setUserSelectedInMassCreation', [])
      this.getUsers()
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
