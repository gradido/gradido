<template>
  <div class="resetpwd-form">
    <b-container>
      <div class="header p-4" ref="header">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
              <h1>{{ $t(displaySetup.authenticated) }}</h1>
              <div class="pb-4">
                <span>
                  <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
                  {{ $t(displaySetup.notAuthenticated) }}
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
          <b-card no-body class="border-0 gradido-custom-background">
            <b-card-body class="p-4">
              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <input-password-confirmation v-model="form" />
                  <div class="text-center">
                    <b-button type="submit" variant="primary" class="mt-4">
                      <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
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
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation'
import { setPassword } from '@/graphql/mutations'

const textFields = {
  reset: {
    authenticated: 'settings.password.change-password',
    notAuthenticated: 'settings.password.reset-password.text',
    button: 'settings.password.change-password',
    linkTo: '/login',
  },
  checkEmail: {
    authenticated: 'settings.password.set',
    notAuthenticated: 'settings.password.set-password.text',
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
      displaySetup: {},
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
          if (this.$route.path.includes('checkEmail')) {
            this.$router.push('/thx/checkEmail')
          } else {
            this.$router.push('/thx/resetPassword')
          }
        })
        .catch((error) => {
          this.toastError(error.message)
          if (error.message.includes('Code is older than 10 minutes'))
            this.$router.push('/forgot-password/resetPassword')
        })
    },
    setDisplaySetup() {
      if (this.$route.path.includes('checkEmail')) {
        this.displaySetup = textFields.checkEmail
      }
      if (this.$route.path.includes('reset-password')) {
        this.displaySetup = textFields.reset
      }
    },
  },
  created() {
    this.setDisplaySetup()
  },
}
</script>
