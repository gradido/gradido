<template>
  <div class="component-confirm-register-mail">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div class="h5">
        Die letzte Email wurde am
        <b>{{ dateLastSend }} Uhr</b>
        an das Mitglied ({{email}}) gesendet.
      </div>

      <!-- Using components -->
      <b-input-group prepend="Email bestätigen, wiederholt senden an:" class="mt-3">
        <b-form-input readonly :value="email"></b-form-input>
        <b-input-group-append>
          <b-button variant="outline-success" @click="sendRegisterMail">Registrierungs-Email bestätigen, jetzt senden</b-button>
        </b-input-group-append>
      </b-input-group>
    </div>
  </div>
</template>
<script>
// import { verifyLogin } from '../graphql/verifyLogin'
// import { createPendingCreation } from '../graphql/createPendingCreation'
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
  data() {
    return {}
  },

  methods: {
    sendRegisterMail() {
      alert(
        'sende wiederholt den ConfirmText an die register E-Mail (' + this.email + ') des User!',
      )
    },
  },
}
</script>
<style>
.input-group-text {
  background-color: rgb(255, 252, 205);
}
</style>
