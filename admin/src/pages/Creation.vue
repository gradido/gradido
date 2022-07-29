<template>
  <div class="creation">
    <b-row>
      <b-col cols="12" lg="6">
        <label>{{ $t('user_search') }}</label>
        <b-input-group>
          <b-form-input
            type="text"
            class="test-input-criteria"
            v-model="criteria"
            :placeholder="$t('user_search')"
          ></b-form-input>

          <b-input-group-append class="test-click-clear-criteria" @click="criteria = ''">
            <b-input-group-text class="pointer">
              <b-icon icon="x" />
            </b-input-group-text>
          </b-input-group-append>
        </b-input-group>
        <select-users-table
          v-if="itemsList.length > 0"
          :items="itemsList"
          :fields="Searchfields"
          @push-item="pushItem"
        />
        <b-pagination
          pills
          v-model="currentPage"
          per-page="perPage"
          :total-rows="rows"
          align="center"
          hide-ellipsis="true"
        ></b-pagination>
      </b-col>
      <b-col cols="12" lg="6" class="shadow p-3 mb-5 rounded bg-info">
        <div v-show="itemsMassCreation.length > 0">
          <div class="text-right pr-4 mb-1">
            <b-button @click="removeAllBookmarks()" variant="light">
              <b-icon icon="x" scale="2" variant="danger"></b-icon>

              {{ $t('remove_all') }}
            </b-button>
          </div>
          <selected-users-table
            class="shadow p-3 mb-5 bg-white rounded"
            :items="itemsMassCreation"
            :fields="fields"
            @remove-item="removeItem"
          />
        </div>
        <div v-if="itemsMassCreation.length === 0">
          {{ $t('multiple_creation_text') }}
        </div>
        <creation-formular
          v-else
          type="massCreation"
          :creation="creation"
          :items="itemsMassCreation"
          @remove-all-bookmark="removeAllBookmarks"
          @toast-failed-creations="toastFailedCreations"
        />
      </b-col>
    </b-row>
  </div>
</template>
<script>
import CreationFormular from '../components/CreationFormular.vue'
import SelectUsersTable from '../components/Tables/SelectUsersTable.vue'
import SelectedUsersTable from '../components/Tables/SelectedUsersTable.vue'
import { searchUsers } from '../graphql/searchUsers'
import { creationMonths } from '../mixins/creationMonths'

export default {
  name: 'Creation',
  mixins: [creationMonths],
  components: {
    CreationFormular,
    SelectUsersTable,
    SelectedUsersTable,
  },
  data() {
    return {
      showArrays: false,
      itemsList: [],
      itemsMassCreation: this.$store.state.userSelectedInMassCreation,
      radioSelectedMass: '',
      criteria: '',
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
            filters: {
              byActivated: true,
              byDeleted: false,
            },
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
          this.toastError(error.message)
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
    removeAllBookmarks() {
      this.itemsMassCreation = []
      this.$store.commit('setUserSelectedInMassCreation', [])
      this.getUsers()
    },
    toastFailedCreations(failedCreations) {
      failedCreations.forEach((email) =>
        this.toastError(this.$t('creation_form.creation_failed', { email })),
      )
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
