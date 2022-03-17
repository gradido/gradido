<template>
  <div class="show-transaction-link-informations">
    <div class="text-center"><b-img :src="img" fluid alt="logo"></b-img></div>
    <b-container class="pt-5">
      <div>
        <b-jumbotron bg-variant="info" text-variant="dark" border-variant="dark">
          <h1>
            {{ displaySetup.user.firstName }}
            {{ $t('transaction-link.send_you') }} {{ displaySetup.amount | GDD }}
          </h1>
          <b>{{ displaySetup.memo }}</b>
        </b-jumbotron>
      </div>

      <div>
        <b-jumbotron>
          <div class="mb-6"><h2>Einlösen</h2></div>

          <b-row>
            <b-col col sm="12" md="6">
              <p>Du hast noch kein Gradido Konto</p>
              <b-button variant="primary" to="/register">Registriere ein neues Konto</b-button>
            </b-col>
            <b-col sm="12" md="6" class="mt-xs-6 mt-sm-6 mt-md-0">
              <p>Du hast einen Gradido Konto</p>
              <b-button variant="info" to="/login">Log dich ein</b-button>
            </b-col>
          </b-row>
        </b-jumbotron>
      </div>
    </b-container>
  </div>
</template>
<script>
import { queryTransactionLink } from '@/graphql/queries'

export default {
  name: 'ShowTransactionLinkInformations',
  data() {
    return {
      img: '/img/brand/green.png',
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
          this.$store.commit('publisherId', result.data.queryTransactionLink.user.publisherId)
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
