<template>
  <card style="background-color: #ebebeba3 !important">
    <b-form @submit.prevent="updateProfile" @change.prevent="alert('änderung')">
      <h6 class="heading-small text-muted mb-4">{{ $t('form.userPageSettings') }}</h6>

      <b-input-group class="mb-2">
        <b-input-group-prepend is-text>
          <input type="checkbox" aria-label="Email new GDD" />
        </b-input-group-prepend>
        <div class="ml-3">
          Ich möchte per E-Mail benachrichtigt werden wenn ich Gradidos erhalte.
        </div>
      </b-input-group>

      <b-input-group class="mb-2">
        <b-input-group-prepend is-text>
          <input type="checkbox" aria-label="Email befor send GDD" />
        </b-input-group-prepend>
        <div class="ml-3">
          Ich möchte eine E-Mail bestätigen um Gradidos entgültig zu versenden.
        </div>
      </b-input-group>

      <b-input-group class="mb-2">
        <b-input-group-prepend is-text>
          <input type="checkbox" aria-label="Checkbox for following text input" />
        </b-input-group-prepend>
        <div class="ml-3">Ich möchte einen Monatlichen Bericht per Email erhalten</div>
      </b-input-group>

      <b-input-group class="mb-2">
        <base-input label="Mit welcher Sprache soll deine App immer starten?">
          <select class="form-control">
            <option>Deutsch</option>
            <option>English</option>
          </select>
        </base-input>
      </b-input-group>

      <hr />
      <h6 class="heading-small text-muted mb-4">Sicherheit und Privatphäre</h6>

      <b-input-group class="mb-2">
        <b-input-group-prepend is-text>
          <input type="checkbox" aria-label="user finden in suche" />
        </b-input-group-prepend>
        <div class="ml-3">Ja, Ich möchte in der Mitgliedersuche zu finden sein.</div>
      </b-input-group>
      <b-input-group class="mb-2">
        <b-input-group-prepend is-text>
          <input type="checkbox" aria-label="GDD open status" />
        </b-input-group-prepend>
        <div class="ml-3">Ja, Ich möchte das mein GDD Status öffentlich ist.</div>
      </b-input-group>
      <hr />

      <b-input-group>
        <b-input-group-prepend is-text>
          <input
            type="radio"
            id="jack"
            value="Jack"
            v-model="checkedNames"
            aria-label="Radio for following text input"
          />
        </b-input-group-prepend>
        <div class="ml-3">
          Ich möchte nur meine
          <b>E-Mail</b>
          öffentlich anzeigen lassen.
        </div>
      </b-input-group>
      <b-input-group>
        <b-input-group-prepend is-text>
          <input
            type="radio"
            id="bob"
            value="bob"
            v-model="checkedNames"
            aria-label="Radio for following text input"
          />
        </b-input-group-prepend>
        <div class="ml-3">
          Ich möchte nur meinen
          <b>Usernamen</b>
          öffentlich anzeigen lassen.
        </div>
      </b-input-group>
      <b-input-group>
        <b-input-group-prepend is-text>
          <input
            type="radio"
            id="alice"
            value="alice"
            v-model="checkedNames"
            aria-label="Radio for following text input"
          />
        </b-input-group-prepend>
        <div class="ml-3">
          Ich
          <b>Usernamen</b>
          und
          <b>E-Mail</b>
          öffentlich anzeigen lassen.
        </div>
      </b-input-group>

      <div class="text-center">
        <b-button type="submit" variant="secondary" class="mt-4">
          {{ $t('form.save') }}
        </b-button>
      </div>
    </b-form>
  </card>
</template>
<script>
export default {
  data() {
    return {
      checkedNames: '',
      form: {
        change: false,
      },
      user: {
        username: this.$store.state.user.userName,
        email: this.$store.state.email,
        firstName: this.$store.state.user.firstName,
        lastName: this.$store.state.user.lastName,
        address: '',
        city: '',
        country: '',
        postalCode: '',
        aboutMe: '',
      },
    }
  },
  methods: {
    alert(str) {
      alert('ALERT FUNCTION :)=>', str)
    },
    updateProfile() {
      alert('Your data: ' + JSON.stringify(this.user))
    },
  },
}
</script>
<style></style>
