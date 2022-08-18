<template>
  <div class="contribution-messages-formular">
    <div v-if="form.text !== ''" class="mt-5">
      <h4>Vorschau</h4>
      <div class="border border-info m-5">
        <b-row>
          <b-col cols="1"><b-avatar square text="AA"></b-avatar></b-col>
          <b-col cols="11">
            <pre class="ml-3 mt-3 mb-5">
              <span class="ml-2 mr-2">
              {{ $store.state.moderator.firstName }} {{ $store.state.moderator.lastName }}
            </span>
            {{ form.text }}</pre>
          </b-col>
        </b-row>
      </div>
    </div>
    <div>
      <b-form @submit="onSubmit" @reset="onReset">
        <b-form-textarea
          id="textarea"
          v-model="form.text"
          placeholder="Enter something..."
          rows="3"
          max-rows="6"
        ></b-form-textarea>
        <b-button type="submit" variant="primary">Submit</b-button>
        <b-button type="reset" variant="danger">Reset</b-button>
      </b-form>
    </div>
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
