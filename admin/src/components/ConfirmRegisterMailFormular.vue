<template>
  <div class="component-confirm-register-mail">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div class="h5">
        {{ $t('unregister_mail.text', { date: dateLastSend, mail: email }) }}
      </div>

      <!-- Using components -->
      <b-input-group :prepend="$t('unregister_mail.info')" class="mt-3">
        <b-form-input readonly :value="email"></b-form-input>
        <b-input-group-append>
          <b-button variant="outline-success" class="test-button" @click="sendRegisterMail">
            {{ $t('unregister_mail.button') }}
          </b-button>
        </b-input-group-append>
      </b-input-group>
    </div>
  </div>
</template>
<script>
import { sendActivationEmail } from '../graphql/sendActivationEmail'

export default {
  name: 'ConfirmRegisterMail',
  props: {
    email: {
      type: String,
    },
    dateLastSend: {
      type: String,
    },
  },
  methods: {
    sendRegisterMail() {
      this.$apollo
        .mutate({
          mutation: sendActivationEmail,
          variables: {
            email: this.email,
          },
        })
        .then(() => {
          this.$toasted.success(this.$t('unregister_mail.success', { email: this.email }))
        })
        .catch((error) => {
          this.$toasted.error(this.$t('unregister_mail.error', { message: error.message }))
        })
    },
  },
}
</script>
<style>
.input-group-text {
  background-color: rgb(255, 252, 205);
}
</style>
