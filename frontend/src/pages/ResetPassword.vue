<template>
  <!-- change to "enterData", see Login.vue -->
  <div v-if="!showPageMessage" class="resetpwd-form">
    <div class="pb-5">{{ $t('site.resetPassword.heading') }}</div>
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
  </div>
  <div v-else>
    <message
      :headline="messageHeadline"
      :subtitle="messageSubtitle"
      :buttonText="messageButtonText"
      :linkTo="messageButtonLinktTo"
    />
  </div>
</template>

<script>
import { setPassword } from '@/graphql/mutations'
import { queryOptIn } from '@/graphql/queries'
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
}

export default {
  name: 'ResetPassword',
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
      showPageMessage: false, // compute "enterData"
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
          if (
            error.message.match(
              /email was sent more than ([0-9]+ hours)?( and )?([0-9]+ minutes)? ago/,
            )
          ) {
            // Wolle: this.$router.push('/forgot-password/resetPassword')
            errorMessage = error.message // Wolle: shall the error get in the message
          } else {
            errorMessage = error.message // Wolle: shall the error get in the message
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
    this.$emit('set-mobile-start', false)
    this.setDisplaySetup()
  },
}
</script>
