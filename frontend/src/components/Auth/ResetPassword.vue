<template>
  <div class="auth-resetpwd-form">
    <b-card class="border-0 gradido-custom-background">
      <div class="text-center">
        <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
        <h1>{{ $t(displaySetup.title) }}</h1>
        <div class="pb-4">
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          {{ $t(displaySetup.text) }}
        </div>
      </div>
      <b-card-body class="p-4">
        <validation-observer ref="observer" v-slot="{ handleSubmit }">
          <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
            <input-password-confirmation v-model="form" />
            <div class="text-center">
              <b-button type="submit" variant="gradido" class="mt-4">
                <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
                {{ $t(displaySetup.button) }}
              </b-button>
            </div>
          </b-form>
        </validation-observer>
      </b-card-body>
    </b-card>
  </div>
</template>
<script>
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation'
import { setPassword } from '@/graphql/mutations'
import { queryOptIn } from '@/graphql/queries'

const textFields = {
  reset: {
    title: 'settings.password.change-password',
    text: 'settings.password.reset-password.text',
    button: 'settings.password.change-password',
    linkTo: '/login',
  },
  checkEmail: {
    title: 'settings.password.set',
    text: 'settings.password.set-password.text',
    button: 'settings.password.set',
    linkTo: '/login',
  },
  login: {
    headline: 'site.thx.errorTitle',
    subtitle: 'site.thx.activateEmail',
  },
}

export default {
  name: 'AuthResetPassword',
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
            if (this.$route.params.code) {
              this.$router.push('/thx/checkEmail/' + this.$route.params.code)
            } else {
              this.$router.push('/thx/checkEmail')
            }
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
    checkOptInCode() {
      this.$apollo
        .query({
          query: queryOptIn,
          variables: {
            optIn: this.$route.params.optin,
          },
        })
        .then()
        .catch((error) => {
          this.toastError(error.message)
          this.$router.push('/forgot-password/resetPassword')
        })
    },
    setDisplaySetup() {
      this.checkOptInCode()
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
