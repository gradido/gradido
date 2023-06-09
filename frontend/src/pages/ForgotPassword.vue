<!-- eslint-disable prettier/prettier -->
<template>
  <div class="forgot-password">
    <b-container v-if="enterData">
      <div class="pb-5">{{ $t('site.forgotPassword.heading') }}</div>
      <b-row class="justify-content-center">
        <b-col>
          <validation-observer ref="observer" v-slot="{ handleSubmit, valid }">
            <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
              <input-email
                v-model="form.email"
                :name="$t('form.email')"
                :label="$t('form.email')"
                :placeholder="$t('form.email')"
              ></input-email>
              <b-row>
                <b-col cols="12" lg="6">
                <b-button type="submit" :variant="valid ? 'gradido' : 'gradido-disable'" block :disabled="!valid">
                  {{ $t('settings.password.send_now') }}
                </b-button>
              </b-col>
            </b-row>
            </b-form>
          </validation-observer>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-else>
      <message
        :headline="success ? $t('message.title') : $t('message.errorTitle')"
        :subtitle="success ? $t('message.email') : $t('error.email-already-sent')"
        :data-test="success ? 'forgot-password-success' : 'forgot-password-error'"
        :buttonText="$t('login')"
        linkTo="/login"
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
