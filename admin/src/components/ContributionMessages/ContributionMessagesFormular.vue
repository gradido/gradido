<template>
  <div class="contribution-messages-formular">
    <b-form @submit="onSubmit" @reset="onReset">
      <b-form-textarea
        id="textarea"
        v-model="form.text"
        placeholder="Enter something..."
        rows="3"
        max-rows="6"
      ></b-form-textarea>
      <p v-if="form.text !== ''" class="mt-5">Vorschau</p>
      <pre class="ml-3 mt-3 mb-5">{{ form.text }}</pre>
      <b-button type="submit" variant="primary">Submit</b-button>
      <b-button type="reset" variant="danger">Reset</b-button>
    </b-form>
  </div>
</template>
<script>
export default {
  name: 'ContributionMessagesFormular',
  data() {
    return {
      form: {
        text: '',
      },
    }
  },
  methods: {
    onSubmit(event) {
      event.preventDefault()
      alert(JSON.stringify(this.form))
    },
    onReset(event) {
      event.preventDefault()
      this.form.text = ''
    },
  },
}
</script>
