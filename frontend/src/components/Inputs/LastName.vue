<template>
  <div role="group" class="last-name">
    <label for="input-lastName">Nachname:</label>
    <b-form-input
      id="input-lastName"
      v-model="lastName"
      :state="lastNameState"
      aria-describedby="input-live-help input-live-feedback"
      placeholder="Enter your lastName"
      trim
    ></b-form-input>

    <!-- This will only be shown if the preceding input has an invalid state -->
    <b-form-invalid-feedback id="input-live-feedback">
      Enter at least 3 letters
    </b-form-invalid-feedback>

    <!-- This is a form text block (formerly known as help block) -->
    <b-form-text id="input-live-help">Dein Nachname</b-form-text>
  </div>
</template>

<script>
export default {
  name: 'lastName',
  props: {
    value: { type: String, default: '' },
  },
  data() {
    return {
      lastName: this.value,
    }
  },
  computed: {
    lastNameState() {
      return this.lastName.length > 2
    },
  },
}
</script>
