<template>
  <div class="community-page">
    <div>
      <b-tabs no-nav-style borderless v-model="tabIndex" align="center">
        <b-tab no-body>
          <open-creations-amount
            :minimalDate="minimalDate"
            :maxGddLastMonth="maxForMonths[0]"
            :maxGddThisMonth="maxForMonths[1]"
          />
          <div class="mb-3"></div>
          <contribution-form
            @set-contribution="setContribution"
            @update-contribution="updateContribution"
            v-model="form"
            :isThisMonth="isThisMonth"
            :minimalDate="minimalDate"
            :maxGddLastMonth="maxForMonths[0]"
            :maxGddThisMonth="maxForMonths[1]"
          />
        </b-tab>
        <b-tab no-body>
          <div v-if="items.length === 0">Du hast noch keine Beiträge eingereicht.</div>
          <div v-else>
            <contribution-list
              @closeAllOpenCollapse="closeAllOpenCollapse"
              :items="items"
              @update-list-contributions="updateListContributions"
              @update-contribution-form="updateContributionForm"
              @delete-contribution="deleteContribution"
              @update-state="updateState"
              :contributionCount="contributionCount"
              :showPagination="true"
              :pageSize="pageSize"
            />
          </div>
        </b-tab>
        <b-tab no-body>
          <div v-if="items.length === 0">Du hast noch keine Beiträge eingereicht.</div>
          <div v-else>
            <contribution-list
              :items="itemsAll"
              @update-list-contributions="updateListAllContributions"
              @update-contribution-form="updateContributionForm"
              :contributionCount="contributionCountAll"
              :showPagination="true"
              :pageSize="pageSizeAll"
              :allContribution="true"
            />
          </div>
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>
<script>
import OpenCreationsAmount from '@/components/Contributions/OpenCreationsAmount.vue'
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
import ContributionList from '@/components/Contributions/ContributionList.vue'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import { listContributions, listAllContributions, openCreations } from '@/graphql/queries'

export default {
  name: 'Community',
  components: {
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
        hours: 0,
        amount: '',
      },
      updateAmount: '',
      maximalDate: new Date(),
      openCreations: [],
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.tabIndex = this.tabLinkHashes.findIndex((hashLink) => hashLink === this.$route.hash)
      this.hashLink = this.$route.hash
    })
  },
  apollo: {
    OpenCreations: {
      query() {
        return openCreations
      },
      fetchPolicy: 'network-only',
      variables() {
        return {}
      },
      update({ openCreations }) {
        this.openCreations = openCreations
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
  watch: {
    $route(to, from) {
      this.tabIndex = this.tabLinkHashes.findIndex((hashLink) => hashLink === to.hash)
      this.hashLink = to.hash
      this.closeAllOpenCollapse()
    },
    tabIndex(num) {
      if (num !== 0) {
        this.form = {
          id: null,
          date: new Date(),
          memo: '',
          hours: 0,
          amount: '',
        }
      }
    },
  },
  computed: {
    minimalDate() {
      const date = new Date(this.maximalDate)
      return new Date(date.setMonth(date.getMonth() - 1, 1))
    },
    isThisMonth() {
      const formDate = new Date(this.form.date)
      return (
        formDate.getFullYear() === this.maximalDate.getFullYear() &&
        formDate.getMonth() === this.maximalDate.getMonth()
      )
    },
    amountToAdd() {
      // when existing contribution is edited, the amount is added back on top of the amount
      if (this.form.id) return parseInt(this.updateAmount)
      return 0
    },
    maxForMonths() {
      const formDate = new Date(this.form.date)
      if (this.openCreations && this.openCreations.length)
        return this.openCreations.slice(1).map((creation) => {
          if (creation.year === formDate.getFullYear() && creation.month === formDate.getMonth())
            return parseInt(creation.amount) + this.amountToAdd
          return parseInt(creation.amount)
        })
      return [0, 0]
    },
  },
  methods: {
    closeAllOpenCollapse() {
      this.$el.querySelectorAll('.collapse.show').forEach((value) => {
        this.$root.$emit('bv::toggle::collapse', value.id)
      })
    },
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
          this.$apollo.queries.OpenCreations.refetch()
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
          this.$apollo.queries.OpenCreations.refetch()
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
          this.$apollo.queries.OpenCreations.refetch()
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
          if (this.items.length === 0) {
            this.tabIndex = 0
            this.$router.push({ path: '/community#edit' })
            return
          }
          if (this.items.find((item) => item.state === 'IN_PROGRESS')) {
            this.tabIndex = 1
            if (this.$route.hash !== '#my') {
              this.$router.push({ path: '/community#my' })
            }
            this.toastInfo(this.$t('contribution.alert.answerQuestionToast'))
          }
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    updateContributionForm(item) {
      this.form.id = item.id
      this.form.date = item.contributionDate
      this.form.memo = item.memo
      this.form.amount = item.amount
      this.form.hours = item.amount / 20
      this.updateAmount = item.amount
      this.$router.push({ path: '#edit' })
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
    this.$router.push({ path: '/community#my' })
  },
}
</script>
<style scoped>
.tab-content {
  border-left: none;
  border-right: none;
}
</style>
