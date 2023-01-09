<template>
  <div class="forgot-password">
    <b-container v-if="enterData">
      <div class="pb-5">{{ $t('site.forgotPassword.heading') }}</div>
      <b-row class="justify-content-center">
        <b-col>
          <validation-observer ref="observer" v-slot="{ handleSubmit }">
            <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
              <input-email
                v-model="form.email"
                :name="$t('form.email')"
                :label="$t('form.email')"
                :placeholder="$t('form.email')"
              ></input-email>
              <div class="text-center">
                <b-button type="submit" variant="gradido">
                  {{ $t('settings.password.send_now') }}
                </b-button>
              </div>
            </b-form>
          </validation-observer>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-else>
      <message v-if=success
        :headline="$t('message.title')"
        :subtitle="$t('message.email')"
        :buttonText="$t('login')"
        linkTo="/login"
        data-test="forgot-password-success"
      />
      <message v-else
        :headline="$t('message.errorTitle')"
        :subtitle="$t('error.email-already-sent')"
        :buttonText="$t('login')"
        linkTo="/login"
        data-test="forgot-password-error"
      />
    </b-container>
  </div>
</template>

<script>
import { forgotPassword } from '@/graphql/mutations'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'

export default {
  name: 'ForgotPassword',
  components: {
    InputEmail,
    Message,
  },
  data() {
    return {
      form: {
        email: '',
      },
      subtitle: 'settings.password.subtitle',
      showPageMessage: false,
      success: null,
    }
  },
  created() {
    if (this.$route.params.comingFrom) {
      this.subtitle = 'settings.password.resend_subtitle'
    }
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: forgotPassword,
          variables: {
            email: this.form.email,
          },
        })
        .then(() => {
          this.showPageMessage = true
          this.success = true
        })
        .catch(() => {
          this.showPageMessage = true
          this.success = false
          this.toastError(this.$t('error.email-already-sent'))
        })
    },
  },
  computed: {
    enterData() {
      return !this.showPageMessage
    },
  },
}
</script>
