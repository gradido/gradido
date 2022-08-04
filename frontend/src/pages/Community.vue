<template>
  <div>
    <b-container>
      <div class="h3">{{ $t('community.community') }}</div>
      <div class="h1">{{ CONFIG.COMMUNITY_NAME }}</div>
      <div>
        {{ CONFIG.COMMUNITY_DESCRIPTION }}
      </div>
      <div>
        {{ CONFIG.COMMUNITY_URL }}
      </div>
    </b-container>

    <hr />
    <b-container>
      <div class="h3">{{ $t('community.openContributionLinks') }}</div>
      <small>
        {{ $t('community.openContributionLinkText', { _name_: CONFIG.COMMUNITY_NAME }) }}
      </small>
      <ul>
        <li v-for="item in items" v-bind:key="item">{{ item.id }}</li>
      </ul>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.moderators') }}</div>
      <ul>
        <li v-for="item in items" v-bind:key="item">{{ item.id }}</li>
      </ul>
      <mail>{{ supportMail }}</mail>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.statistic') }}</div>
      <div>
        <div>
          {{ $t('community.members') }}
          <span class="h4">{{ membersCount }}</span>
        </div>
      </div>
    </b-container>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'Community',
  data() {
    return {
      CONFIG,
      items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      supportMail: 'support@supportemail.de',
      membersCount: '1203',
    }
  },
  <div class="community-page">
    <div>
      <b-tabs v-model="tabIndex" content-class="mt-3" align="center">
        <b-tab :title="$t('community.submitContribution')" active>
          <contribution-form
            @set-contribution="setContribution"
            @update-contribution="updateContribution"
            v-model="form"
            :updateAmount="updateAmount"
          />
        </b-tab>
        <b-tab :title="$t('community.myContributions')">
          <div>
            <b-alert show dismissible fade variant="secondary" class="text-dark">
              <h4 class="alert-heading">{{ $t('community.myContributions') }}</h4>
              <p>
                {{ $t('contribution.alert.myContributionNoteList') }}
              </p>
              <ul class="h2">
                <li>
                  <b-icon icon="bell-fill" variant="primary"></b-icon>
                  {{ $t('contribution.alert.pending') }}
                </li>
                <li>
                  <b-icon icon="check" variant="success"></b-icon>
                  {{ $t('contribution.alert.confirm') }}
                </li>
                <li>
                  <b-icon icon="x-circle" variant="danger"></b-icon>
                  {{ $t('contribution.alert.rejected') }}
                </li>
              </ul>
              <hr />
              <p class="mb-0">
                {{ $t('contribution.alert.myContributionNoteSupport') }}
              </p>
            </b-alert>
          </div>
          <contribution-list
            :items="items"
            @update-list-contributions="updateListContributions"
            @update-contribution-form="updateContributionForm"
            @delete-contribution="deleteContribution"
            :contributionCount="contributionCount"
            :showPagination="true"
            :pageSize="pageSize"
          />
        </b-tab>
        <b-tab :title="$t('navigation.community')">
          <b-alert show dismissible fade variant="secondary" class="text-dark">
            <h4 class="alert-heading">{{ $t('navigation.community') }}</h4>
            <p>
              {{ $t('contribution.alert.communityNoteList') }}
            </p>
            <ul class="h2">
              <li>
                <b-icon icon="bell-fill" variant="primary"></b-icon>
                {{ $t('contribution.alert.pending') }}
              </li>
              <li>
                <b-icon icon="check" variant="success"></b-icon>
                {{ $t('contribution.alert.confirm') }}
              </li>
            </ul>
          </b-alert>
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
      updateAmount: '',
    }
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
  },
}
</script>
