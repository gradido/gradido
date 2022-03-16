<template>
  <div class="show-transaction-link">
    <!-- Header -->
    <div class="header py-7 py-lg-8 pt-lg-9">
      <b-container>
        <div class="header-body text-center mb-7">
          <p class="h1">
            {{ displaySetup.user.firstName }}
            {{ $t('transaction-link.send_you') }} {{ displaySetup.amount | GDD }}
          </p>
          <p class="h4">{{ displaySetup.memo }}</p>
          <hr />
          <b-button v-if="displaySetup.linkTo" :to="displaySetup.linkTo">
            {{ $t('transaction-link.button') }}
          </b-button>
        </div>
      </b-container>
    </div>
  </div>
</template>
<script>
import { queryTransactionLink } from '@/graphql/queries'

export default {
  name: 'ShowTransactionLink',
  data() {
    return {
      displaySetup: {
        user: {
          firstName: '',
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
          this.displaySetup = result.data.queryTransactionLink
          this.$store.commit('publisherId', result.data.queryTransactionLink.user.id)
        })
        .catch((error) => {
          this.toastError(error)
        })
    },
  },
  created() {
    this.setTransactionLinkInformation()
  },
}
</script>
