<template>
  <div>
    <!-- Header -->
    <div class="header py-7 py-lg-8 pt-lg-9">
      <b-container>
        <div class="header-body text-center mb-7">
          <div class="mb-5">resultDB : {{ resultDB }}</div>
          <p class="h1">
            {{ displaySetup.user.firstName }} {{ displaySetup.user.lastName }}
            {{ $t('wants to send you') }} {{ displaySetup.amount | GDD }}
          </p>
          <p class="h4">{{ $t(displaySetup.subtitle) }}</p>
          <hr />
          <b-button v-if="displaySetup.linkTo" :to="displaySetup.linkTo">
            {{ $t(displaySetup.button) }}
          </b-button>
        </div>
      </b-container>
    </div>
  </div>
</template>
<script>
import { queryTransactionLink } from '@/graphql/queries'

export default {
  name: 'ShowTransactionLinkInformations',
  data() {
    return {
      resultDB: {},
      displaySetup: {
        amount: '123456',
        linkTo: '',
        user: {
          publisherId: 1,
          firstName: 'testName',
          lastName: 'testOgerly',
        },
      },
    }
  },
  methods: {
    setTransactionLinkInformation() {
      this.$apollo
        .query({
          query: queryTransactionLink,
          variables: {
            code: this.$route.params.code,
          },
        })
        .then((result) => {
          const {
            data: { queryTransactionLink },
          } = result
          this.resultDB = queryTransactionLink
          this.displaySetup = queryTransactionLink
          this.$store.commit('publisherId', queryTransactionLink.user.publisherId)
        })
        .catch((error) => {
          this.toastError(error)
        })
    },
  },
  created() {
    this.setTransactionLinkInformation()
    this.displaySetup.linkTo = this.$route.params.code
  },
}
</script>
