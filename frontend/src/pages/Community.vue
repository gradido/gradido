<template>
  <div class="community-page">
    <div>
      <b-tabs content-class="mt-3" align="center">
        <b-tab :title="$t('community.writing')" active>
          <contribution-form @set-contribution="setContribution" />
        </b-tab>
        <b-tab :title="$t('community.myContributions')">
          <contribution-list :items="items" />
        </b-tab>
        <b-tab :title="$t('navigation.community')">
          <contribution-list :items="items" />
          <contribution-list :items="items" />
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>
<script>
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
import ContributionList from '@/components/Contributions/ContributionList.vue'
import { createContribution } from '@/graphql/mutations'
import { listContributions } from '@/graphql/queries'

export default {
  name: 'Community',
  components: {
    ContributionForm,
    ContributionList,
  },
  data() {
    return {
      currentPage: 1,
      pageSize: 25,
      items: [],
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
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    getListContributions(data) {
      this.$apollo
        .query({
          fetchPolicy: 'no-cache',
          query: listContributions,
          variables: {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          },
        })
        .then((result) => {
          // console.log('result', result.data)
          const {
            data: { listContributions },
          } = result
          this.items = listContributions
          // this.toastSuccess(result.data)
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
  },
  created() {
    this.getListContributions()
  },
}
</script>
