<template>
  <div class="show-transaction-link-informations">
    <div class="text-center"><b-img :src="img" fluid alt="logo"></b-img></div>
    <b-container v-if="displaySetup.redeemedAt" class="pt-5">
      <b-jumbotron bg-variant="info" text-variant="dark" border-variant="dark">
        <div class="text-center">
          <h1>
            {{ $t('gdd_per_link.link-invalid') }}
          </h1>
        </div>
      </b-jumbotron>
      <div class="text-center">
        <b-button to="/overview">{{ $t('back') }}</b-button>
      </div>
    </b-container>
    <b-container v-else-if="displaySetup.deletedAt" class="pt-5">
      <b-jumbotron bg-variant="info" text-variant="dark" border-variant="dark">
        <div class="text-center">
          <h1>
            {{ $t('gdd_per_link.link-deleted') }}
          </h1>
        </div>
      </b-jumbotron>
      <div class="text-center">
        <b-button to="/overview">{{ $t('back') }}</b-button>
      </div>
    </b-container>
    <b-container v-else-if="redeemed" class="pt-5">
      <b-jumbotron bg-variant="info" text-variant="dark" border-variant="dark">
        <div class="text-center">
          <h1>
            {{ $t('gdd_per_link.redeemed', { n: displaySetup.amount }) }}
          </h1>
        </div>
      </b-jumbotron>
      <div class="text-center">
        <b-button to="/overview">{{ $t('back') }}</b-button>
      </div>
    </b-container>
    <b-container v-else class="pt-5">
      <div>
        <div></div>
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
            <b-button :disabled="disabled" variant="primary" @click="redeemLink" size="lg">
              {{ $t('gdd_per_link.redeem') }}
            </b-button>
            <div v-if="disabled" class="mt-3">
              {{ $t('gdd_per_link.no-redeem') }}
              <a to="/transactions" href="#!">
                <b>{{ $t('gdd_per_link.link-overview') }}</b>
              </a>
            </div>
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
import { redeemTransactionLink } from '@/graphql/mutations'

export default {
  name: 'ShowTransactionLinkInformations',
  data() {
    return {
      img: '/img/brand/green.png',
      displaySetup: {
        user: {
          firstName: '',
        },
        deletedAt: null,
      },
      redeemed: null,
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
        })
        .catch(() => {
          this.displaySetup.deletedAt = true
        })
    },
    redeemLink() {
      this.$bvModal.msgBoxConfirm(this.$t('gdd_per_link.redeem-text')).then(async (value) => {
        if (value)
          await this.$apollo
            .mutate({
              mutation: redeemTransactionLink,
              variables: {
                id: this.displaySetup.id,
              },
            })
            .then((result) => {
              if (result) this.redeemed = true
              alert(result.data.redeemTransactionLink)
              // this.toastSuccess(this.$t('gdd_per_link.deleted'))
              // this.$emit('reset-transaction-link-list')
            })
            .catch((err) => {
              this.toastError(err.message)
            })
      })
    },
  },
  computed: {
    disabled() {
      return this.displaySetup.user.email === this.$store.state.email
    },
  },
  created() {
    this.setTransactionLinkInformation()
  },
}
</script>
