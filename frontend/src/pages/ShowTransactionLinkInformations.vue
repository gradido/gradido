<template>
  <div class="show-transaction-link-informations">
    <div class="text-center"><b-img :src="img" fluid alt="logo"></b-img></div>
    <b-container class="pt-5">
      displaySetup : {{displaySetup}} 
      <div>
        <b-jumbotron bg-variant="info" text-variant="dark" border-variant="dark">
          <h1>
            {{ displaySetup.user.firstName }}
            {{ $t('transaction-link.send_you') }} {{ displaySetup.amount | GDD }}
          </h1>
          <b>{{ displaySetup.memo }}</b>
        </b-jumbotron>
      </div>

      <div v-if="$store.state.token">
        <b-jumbotron>
          <div class="mb-3 text-center">
             
            
              <b-button variant="primary" to="/register" size="lg">
                {{ $t('gdd_per_link.redeem') }}
              </b-button>
          </div>
        </b-jumbotron>
      </div>

      <div v-else>
        <b-jumbotron>
          <div class="mb-6">
            <h2>{{ $t('gdd_per_link.redeem') }}</h2>
          </div>

          <b-row>
            <b-col col sm="12" md="6">
              <p>{{ $t('gdd_per_link.no-account') }}</p>
              <b-button variant="primary" to="/register">
                {{ $t('gdd_per_link.to-register') }}
              </b-button>
            </b-col>
            <b-col sm="12" md="6" class="mt-xs-6 mt-sm-6 mt-md-0">
              <p>{{ $t('gdd_per_link.has-account') }}</p>
              <b-button variant="info" to="/login">{{ $t('gdd_per_link.to-login') }}</b-button>
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
    redeemLink() {
      this.$bvModal.msgBoxConfirm(this.$t('gdd_per_link.redeem-text')).then(async (value) => {
        if (value)
          await this.$apollo
            .mutate({
              mutation: deleteTransactionLink,
              variables: {
                id: this.id,
              },
            })
            .then(() => {
              this.toastSuccess(this.$t('gdd_per_link.deleted'))
              this.$emit('reset-transaction-link-list')
            })
            .catch((err) => {
              this.toastError(err.message)
            })
      })
    },
  },
  created() {
    this.setTransactionLinkInformation()
    console.log(this)
  },
}
</script>
