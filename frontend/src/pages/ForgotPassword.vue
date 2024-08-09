<!-- eslint-disable prettier/prettier -->
<template>
  <div class="forgot-password">
    <b-container v-if="enterData">
      <div class="pb-5">{{ $t('site.forgotPassword.heading') }}</div>
      <BRow class="justify-content-center">
        <BCol>
          <validation-observer ref="observer" v-slot="{ handleSubmit, valid }">
            <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
              <input-email
                v-model="form.email"
                :name="$t('form.email')"
                :label="$t('form.email')"
                :placeholder="$t('form.email')"
              ></input-email>
              <BRow>
                <BCol cols="12" lg="6">
                  <b-button
                    type="submit"
                    :variant="valid ? 'gradido' : 'gradido-disable'"
                    block
                    :disabled="!valid"
                  >
                    {{ $t('settings.password.send_now') }}
                  </b-button>
                </BCol>
              </BRow>
            </b-form>
          </validation-observer>
        </BCol>
      </BRow>
    </b-container>
    <b-container v-else>
      <message
        :headline="success ? $t('message.title') : $t('message.errorTitle')"
        :subtitle="success ? $t('message.email') : $t('error.email-already-sent')"
        :data-test="success ? 'forgot-password-success' : 'forgot-password-error'"
        :button-text="$t('login')"
        link-to="/login"
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
  computed: {
    enterData() {
      return !this.showPageMessage
    },
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
}
</script>
<style scoped>
.btn-gradido {
  padding-right: 0;
  padding-left: 0;
}

.btn-gradido-disable {
  padding-right: 0;
  padding-left: 0;
}
</style>
