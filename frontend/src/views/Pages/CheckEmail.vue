<template>
  <div class="checkemail-form">
    <b-container>
      <div class="header p-4" ref="header">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('checkEmail.title') }}</h1>
              <div class="pb-4" v-if="!pending">
                <span v-if="!authenticated">
                  {{ $t('checkEmail.errorText') }}
                </span>
              </div>
            </b-col>
          </b-row>
        </div>
      </div>
    </b-container>
    <b-container class="mt--8 p-1">
      <b-row>
        <b-col class="text-center py-lg-4">
          <router-link to="/Login" class="mt-3">{{ $t('back') }}</router-link>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import { checkEmailQuery } from '../../graphql/queries'

export default {
  name: 'CheckEmail',
  data() {
    return {
      authenticated: false,
      sessionId: null,
      email: null,
      pending: true,
    }
  },
  methods: {
    async authenticate() {
      const loader = this.$loading.show({
        container: this.$refs.header,
      })
      const optin = this.$route.params.optin
      this.$apollo
        .query({
          query: checkEmailQuery,
          variables: {
            optin: optin,
          },
        })
        .then((result) => {
          this.authenticated = true
          this.sessionId = result.data.checkEmail.sessionId
          this.email = result.data.checkEmail.email
          this.$router.push('/thx/checkEmail')
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
      loader.hide()
      this.pending = false
    },
  },
  mounted() {
    this.authenticate()
  },
}
</script>
<style></style>
