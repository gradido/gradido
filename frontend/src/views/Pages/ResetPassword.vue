<template>
  <div class="resetpwd-form">
    <b-container>
      <div class="header p-4" ref="header">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('settings.password.reset') }}</h1>
              <div class="pb-4">
                <span>
                  {{ $t('settings.password.reset-password.text') }}
                </span>
              </div>
            </b-col>
          </b-row>
        </div>
      </div>
    </b-container>
    <b-container class="mt--8 p-1">
      <b-row class="justify-content-center">
        <b-col lg="6" md="8">
          <b-card no-body class="border-0" style="background-color: #ebebeba3 !important">
            <b-card-body class="p-4">
              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <input-password-confirmation v-model="form" />
                  <div class="text-center">
                    <b-button type="submit" variant="primary" class="mt-4">
                      {{ $t(displaySetup.button) }}
                    </b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <b-row v-if="displaySetup.linkTo">
        <b-col class="text-center py-lg-4">
          <router-link :to="displaySetup.linkTo" class="mt-3">{{ $t('back') }}</router-link>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import InputPasswordConfirmation from '../../components/Inputs/InputPasswordConfirmation'
import { setPassword } from '../../graphql/mutations'

const textFields = {
  reset: {
    authenticated: 'settings.password.reset-password.text',
    notAuthenticated: 'settings.password.not-authenticated',
    button: 'settings.password.reset',
    linkTo: '/login',
  },
  checkEmail: {
    authenticated: 'settings.password.set-password.text',
    notAuthenticated: 'settings.password.not-authenticated',
    button: 'settings.password.set',
    linkTo: '/login',
  },
  login: {
    headline: 'site.thx.errorTitle',
    subtitle: 'site.thx.activateEmail',
  },
}

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
    }
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: setPassword,
          variables: {
            code: this.$route.params.optin,
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
      // TODO validate somehow if present and looks good?
      // const optin = this.$route.params.optin
    },
    setDisplaySetup(from) {
      this.displaySetup = textFields[this.$route.params.comingFrom]
    },
  },
  mounted() {
    this.authenticate()
    this.setDisplaySetup()
  },
}
</script>
<style></style>
