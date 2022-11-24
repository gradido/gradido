<template>
  <div class="community-page">
    <div>
      <b-tabs no-nav-style v-model="tabIndex" content-class="mt-3" align="center">
        <b-tab>
          <open-creations-amount />
          <contribution-form
            @set-contribution="setContribution"
            @update-contribution="updateContribution"
            v-model="form"
            :updateAmount="updateAmount"
          />
        </b-tab>
        <b-tab>
          <contribution-list-info list="my" />
          <contribution-list
            :items="items"
            @update-list-contributions="updateListContributions"
            @update-contribution-form="updateContributionForm"
            @delete-contribution="deleteContribution"
            @update-state="updateState"
            :contributionCount="contributionCount"
            :showPagination="true"
            :pageSize="pageSize"
          />
        </b-tab>
        <b-tab>
          <contribution-list-info list="all" />
          <contribution-list
            :items="itemsAll"
            @update-list-contributions="updateListAllContributions"
            @update-contribution-form="updateContributionForm"
            :contributionCount="contributionCountAll"
            :showPagination="true"
            :pageSize="pageSizeAll"
            :allContribution="true"
          />
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>
<script>
import OpenCreationsAmount from '@/components/Contributions/OpenCreationsAmount.vue'
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
import ContributionList from '@/components/Contributions/ContributionList.vue'
import ContributionListInfo from '@/components/Contributions/ContributionListInfo.vue'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import { listContributions, listAllContributions, verifyLogin } from '@/graphql/queries'

export default {
  name: 'Community',
  components: {
    ContributionListInfo,
    ContributionForm,
    ContributionList,
    OpenCreationsAmount,
  },
  data() {
    return {
      hashLink: '',
      tabLinkHashes: ['#edit', '#my', '#all'],
      tabIndex: 0,
      items: [],
      itemsAll: [],
      currentPage: 1,
      pageSize: 25,
      pageSizeAll: 25,
      contributionCount: 0,
      contributionCountAll: 0,
      form: {
        id: null,
        date: '',
        memo: '',
        amount: '',
      },
      updateAmount: '',
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.tabIndex = this.tabLinkHashes.findIndex((hashLink) => hashLink === this.$route.hash)
      this.hashLink = this.$route.hash
    })
  },
  watch: {
    $route(to, from) {
      this.tabIndex = this.tabLinkHashes.findIndex((hashLink) => hashLink === to.hash)
      this.hashLink = to.hash
    },
  },
  methods: {
    setContribution(data) {
      this.$apollo
        .mutate({
          fetchPolicy: 'no-cache',
          mutation: createContribution,
          variables: {
            creationDate: data.date,
            memo: data.memo,
            amount: data.amount,
          },
        })
        .then((result) => {
          this.toastSuccess(this.$t('contribution.submitted'))
          this.updateListContributions({
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          })
          this.updateListAllContributions({
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          })
          this.verifyLogin()
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    updateContribution(data) {
      this.$apollo
        .mutate({
          fetchPolicy: 'no-cache',
          mutation: updateContribution,
          variables: {
            contributionId: data.id,
            creationDate: data.date,
            memo: data.memo,
            amount: data.amount,
          },
        })
        .then((result) => {
          this.toastSuccess(this.$t('contribution.updated'))
          this.updateListContributions({
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          })
          this.updateListAllContributions({
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          })
          this.verifyLogin()
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    deleteContribution(data) {
      this.$apollo
        .mutate({
          fetchPolicy: 'no-cache',
          mutation: deleteContribution,
          variables: {
            id: data.id,
          },
        })
        .then((result) => {
          this.toastSuccess(this.$t('contribution.deleted'))
          this.updateListContributions({
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          })
          this.updateListAllContributions({
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          })
          this.verifyLogin()
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    updateListAllContributions(pagination) {
      this.$apollo
        .query({
          fetchPolicy: 'no-cache',
          query: listAllContributions,
          variables: {
            currentPage: pagination.currentPage,
            pageSize: pagination.pageSize,
          },
        })
        .then((result) => {
          const {
            data: { listAllContributions },
          } = result
          this.contributionCountAll = listAllContributions.contributionCount
          this.itemsAll = listAllContributions.contributionList
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    updateListContributions(pagination) {
      this.$apollo
        .query({
          fetchPolicy: 'no-cache',
          query: listContributions,
          variables: {
            currentPage: pagination.currentPage,
            pageSize: pagination.pageSize,
          },
        })
        .then((result) => {
          const {
            data: { listContributions },
          } = result
          this.contributionCount = listContributions.contributionCount
          this.items = listContributions.contributionList
          if (this.items.find((item) => item.state === 'IN_PROGRESS')) {
            this.tabIndex = 1
          }
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    verifyLogin() {
      this.$apollo
        .query({
          query: verifyLogin,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          const {
            data: { verifyLogin },
          } = result
          this.$store.dispatch('login', verifyLogin)
        })
        .catch(() => {
          this.$emit('logout')
        })
    },
    updateContributionForm(item) {
      this.form.id = item.id
      this.form.date = item.contributionDate
      this.form.memo = item.memo
      this.form.amount = item.amount
      this.updateAmount = item.amount
      this.tabIndex = 0
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
    updateState(id) {
      this.items.find((item) => item.id === id).state = 'PENDING'
    },
  },

  created() {
    // verifyLogin is important at this point so that creation is updated on reload if they are deleted in a session in the admin area.
    this.verifyLogin()
    this.updateListContributions({
      currentPage: this.currentPage,
      pageSize: this.pageSize,
    })
    this.updateListAllContributions({
      currentPage: this.currentPage,
      pageSize: this.pageSize,
    })
    this.updateTransactions(0)
    this.tabIndex = 1
  },
}
</script>
