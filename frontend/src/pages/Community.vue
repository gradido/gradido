<template>
  <div class="community-page">
    <div>
      <b-tabs v-model="tabIndex" content-class="mt-3" align="center">
        <b-tab :title="$t('community.writing')" active>
          <contribution-form
            @set-contribution="setContribution"
            @update-contribution="updateContribution"
            v-model="form"
          />
        </b-tab>
        <b-tab :title="$t('community.myContributions')">
          <contribution-list
            :items="items"
            @update-list-contributions="updateListContributions"
            @update-contribution-form="updateContributionForm"
            :contributionCount="contributionCount"
            :showPagination="true"
            :pageSize="pageSize"
          />
        </b-tab>
        <b-tab :title="$t('navigation.community')">
          <contribution-list
            :items="itemsAll"
            @update-list-contributions="updateListAllContributions"
            @update-contribution-form="updateContributionForm"
            :contributionCount="contributionCountAll"
            :showPagination="true"
            :pageSize="pageSizeAll"
          />
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>
<script>
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
import ContributionList from '@/components/Contributions/ContributionList.vue'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import { listContributions, listAllContributions, verifyLogin } from '@/graphql/queries'

export default {
  name: 'Community',
  components: {
    ContributionForm,
    ContributionList,
  },
  data() {
    return {
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
    }
  },
  methods: {
    setContribution(data) {
      // console.log('setContribution', data)
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
          // console.log('result', result.data)
          this.toastSuccess(result.data)
          this.updateListContributions({
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
      // console.log('setContribution', data)
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
          // console.log('result', result.data)
          this.toastSuccess(result.data)
          this.updateListContributions({
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          })
          this.verifyLogin()
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    deleteContribution(id) {
      this.$apollo
        .mutate({
          fetchPolicy: 'no-cache',
          mutation: deleteContribution,
          variables: {
            id: id,
          },
        })
        .then((result) => {
          // console.log('result', result.data)
          this.toastSuccess(result.data)
          this.updateListContributions({
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
          // console.log('result', result.data)
          const {
            data: { listAllContributions },
          } = result
          this.contributionCountAll = listAllContributions.contributionCount
          this.itemsAll = listAllContributions.contributionList
          // this.toastSuccess(result.data)
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
          // console.log('result', result.data)
          const {
            data: { listContributions },
          } = result
          this.contributionCount = listContributions.contributionCount
          this.items = listContributions.contributionList
          // this.toastSuccess(result.data)
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
      this.tabIndex = 0
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.updateListContributions({
      currentPage: this.currentPage,
      pageSize: this.pageSize,
    })
    this.updateListAllContributions({
      currentPage: this.currentPage,
      pageSize: this.pageSize,
    })
    this.updateTransactions(0)
  },
}
</script>
