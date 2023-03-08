<template>
  <div v-if="enterData" class="resetpwd-form">
    <div class="pb-5">{{ $t('site.resetPassword.heading') }}</div>
    <validation-observer ref="observer" v-slot="{ handleSubmit, valid }">
      <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
        <input-password-confirmation v-model="form" />
        <b-row>
          <b-col cols="12" lg="6">
            <b-button
              block
              type="submit"
              :variant="valid ? 'gradido' : 'gradido-disable'"
              class="mt-4"
              data-test="submit-new-password-btn"
              :disabled="!valid"
            >
              <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
              {{ $t(displaySetup.button) }}
            </b-button>
          </b-col>
        </b-row>
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
      showPageMessage: false,
      messageHeadline: null,
      messageSubtitle: null,
      messageButtonText: null,
      messageButtonLinktTo: null,
    }
  },
  created() {
    this.$emit('set-mobile-start', false)
    this.setDisplaySetup()
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
          this.form.passwordRepeat = ''

          this.showPageMessage = true
          this.messageHeadline = this.$t('message.title')
          this.messageSubtitle = this.$route.path.includes('checkEmail')
            ? this.$t('message.checkEmail')
            : this.$t('message.reset')
          this.messageButtonText = this.$t('login')
          if (this.$route.params.code) {
            this.messageButtonLinktTo = `/login/${this.$route.params.code}`
          } else {
            this.messageButtonLinktTo = '/login'
          }
        })
        .catch((error) => {
          let errorMessage
          if (
            error.message.match(
              /email was sent more than ([0-9]+ hours)?( and )?([0-9]+ minutes)? ago/,
            )
          ) {
            errorMessage = error.message
          } else {
            errorMessage = error.message
          }
          this.showPageMessage = true
          this.messageHeadline = this.$t('message.errorTitle')
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
  computed: {
    enterData() {
      return !this.showPageMessage
    },
  },
}
</script>
<style scoped>
.btn-gradido {
  padding-right: 0px;
  padding-left: 0px;
}
.btn-gradido-disable {
  padding-right: 0px;
  padding-left: 0px;
}
</style>
