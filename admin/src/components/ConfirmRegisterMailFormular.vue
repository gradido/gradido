<template>
  <div class="component-confirm-register-mail">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div class="h5">
        Die letzte Email wurde am
        <b>{{ dateLastSend }} Uhr</b>
        an das Mitglied ({{ email }}) gesendet.
      </div>

      <!-- Using components -->
      <b-input-group prepend="Email bestätigen, wiederholt senden an:" class="mt-3">
        <b-form-input readonly :value="email"></b-form-input>
        <b-input-group-append>
          <b-button variant="outline-success" class="test-button" @click="sendRegisterMail">
            Registrierungs-Email bestätigen, jetzt senden
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
          this.$toasted.success(
            'Erfolgreich senden der Confirmation Link an die E-Mail des Users! ' + this.email,
          )
        })
        .catch((error) => {
          this.$toasted.error(
            'Fehler beim senden des confirmation link an den Benutzer: ' + error.message,
          )
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
