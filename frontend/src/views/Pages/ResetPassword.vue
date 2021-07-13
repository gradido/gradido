<template>
  <div class="resetpwd-form">
    <b-container>
      <div class="header p-4" ref="header">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('reset-password.title') }}</h1>
              <div class="pb-4" v-if="!pending">
                <span v-if="authenticated">
                  {{ $t('reset-password.text') }}
                </span>
                <span v-else>
                  {{ $t('reset-password.not-authenticated') }}
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
                  <input-password-confirmation v-model="form" />
                  <div class="text-center">
                    <b-button type="submit" variant="primary" class="mt-4">
                      {{ $t('reset') }}
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
import loginAPI from '../../apis/loginAPI'
import InputPasswordConfirmation from '../../components/Inputs/InputPasswordConfirmation'

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
    }
  },
  methods: {
    async onSubmit() {
      const result = await loginAPI.changePassword(this.sessionId, this.email, this.form.password)
      if (result.success) {
        this.form.password = ''
        /*
            this.$store.dispatch('login', {
            sessionId: result.result.data.session_id,
            email: result.result.data.user.email,
            })
          */
        this.$router.push('/thx/reset')
      } else {
        this.$toasted.error(result.result.message)
      }
    },
    async authenticate() {
      const loader = this.$loading.show({
        container: this.$refs.header,
      })
      const optin = this.$route.params.optin
      const result = await loginAPI.loginViaEmailVerificationCode(optin)
      if (result.success) {
        this.authenticated = true
        this.sessionId = result.result.data.session_id
        this.email = result.result.data.user.email
      } else {
        this.$toasted.error(result.result.message)
      }
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
