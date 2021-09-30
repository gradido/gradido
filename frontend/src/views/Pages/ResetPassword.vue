<template>
  <div class="resetpwd-form">
    <b-container>
      <div class="header p-4" ref="header">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('settings.password.reset') }}</h1>
              <div class="pb-4" v-if="!pending">
                <span v-if="authenticated">
                  {{ $t('settings.password.reset-password.text') }}
                </span>
                <span v-else>
                  {{ $t('settings.password.reset-password.not-authenticated') }}
                </span>
              </div>
            </b-col>
          </b-row>
        </div>
      </div>
    </b-container>
    <b-container class="mt--8 p-1">
      <b-row class="justify-content-center" v-if="authenticated">
        <b-col lg="6" md="8">
          <b-card no-body class="border-0" style="background-color: #ebebeba3 !important">
            <b-card-body class="p-4">
              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <input-password-confirmation v-model="form" :register="register" />
                  <div class="text-center">
                    <b-button type="submit" variant="primary" class="mt-4">
                      {{ $t('settings.password.reset') }}
                    </b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <b-row>
        <b-col class="text-center py-lg-4">
          <router-link to="/Login" class="mt-3">{{ $t('back') }}</router-link>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import InputPasswordConfirmation from '../../components/Inputs/InputPasswordConfirmation'
import { loginViaEmailVerificationCode } from '../../graphql/queries'
import { resetPassword } from '../../graphql/mutations'

export default {
  name: 'ResetPassword',
  components: {
    InputPasswordConfirmation,
  },
  data() {
    return {
      form: {
        password: '',
        passwordRepeat: '',
      },
      authenticated: false,
      sessionId: null,
      email: null,
      pending: true,
      register: false,
    }
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: resetPassword,
          variables: {
            sessionId: this.sessionId,
            email: this.email,
            password: this.form.password,
          },
        })
        .then(() => {
          this.form.password = ''
          this.$router.push('/thx/reset')
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    async authenticate() {
      const loader = this.$loading.show({
        container: this.$refs.header,
      })
      const optin = this.$route.params.optin
      this.$apollo
        .query({
          query: loginViaEmailVerificationCode,
          variables: {
            optin: optin,
          },
        })
        .then((result) => {
          this.authenticated = true
          this.sessionId = result.data.loginViaEmailVerificationCode.sessionId
          this.email = result.data.loginViaEmailVerificationCode.email
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
