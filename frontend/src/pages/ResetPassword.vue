<template>
  <div class="resetpwd-form">
    <div v-if="!showPageMessage">
      <b-container>
        <div class="header p-4" ref="header">
          <div class="header-body text-center mb-7">
            <b-row class="justify-content-center">
              <b-col xl="5" lg="6" md="8" class="px-2">
                <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
                <h1>{{ $t(displaySetup.title) }}</h1>
                <div class="pb-4">
                  <span>
                    <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
                    {{ $t(displaySetup.text) }}
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
    <div v-else>
      <message
        :headline="messageHeadline"
        :subtitle="messageSubtitle"
        :buttonText="messageButtonText"
        :linkTo="messageButtonLinktTo"
      />
    </div>
  </div>
</template>
<script>
import { setPassword } from '@/graphql/mutations'
import { queryOptIn } from '@/graphql/queries'
import { errors } from '@/mixins/errors'
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation'
import Message from '@/components/Message/Message'

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
  // Wolle: seems unused
  login: {
    headline: 'site.thx.errorTitle',
    subtitle: 'site.thx.activateEmail',
  },
}

export default {
  name: 'ResetPassword',
  mixins: [errors],
  components: {
    InputPasswordConfirmation,
    Message,
  },
  data() {
    return {
      form: {
        password: '',
        passwordRepeat: '',
      },
      displaySetup: {},
      showPageMessage: false,
      messageHeadline: null,
      messageSubtitle: null,
      messageButtonText: null,
      messageButtonLinktTo: null,
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
              // Wolle: refactor
              this.$router.push('/thx/checkEmail/' + this.$route.params.code)
            } else {
              // Wolle: refactor
              this.$router.push('/thx/checkEmail')
            }
          } else {
            // Wolle: refactor
            this.$router.push('/thx/resetPassword')
          }
        })
        .catch((error) => {
          let errorMessage
          // Wolle: how to solve this with error codes?
          if (
            error.message.match(
              /email was sent more than ([0-9]+ hours)?( and )?([0-9]+ minutes)? ago/,
            )
          ) {
            // Wolle: this.$router.push('/forgot-password/resetPassword')
            errorMessage = error.message
          } else {
            errorMessage = error.message
          }
          this.showPageMessage = true
          this.messageHeadline = this.$t('site.thx.errorTitle')
          this.messageSubtitle = errorMessage
          this.messageButtonText = this.$t('settings.password.reset')
          this.messageButtonLinktTo = '/forgot-password/resetPassword'
          this.toastError(errorMessage)
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
          // Wolle: show message as well?
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
