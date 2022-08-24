<template>
  <div class="contribution-messages-formular">
    <div v-if="form.text !== ''" class="mt-5">
      <h4>{{ $t('preview') }}</h4>
      <div class="border border-info m-5">
        <b-row>
          <b-col cols="1"><b-avatar square text="AA"></b-avatar></b-col>
          <b-col cols="11">
            <pre class="mt-2">
            {{ $store.state.firstName }} {{ $store.state.lastName }}
            </pre>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <pre class="ml-3 mt-3 mb-5">{{ form.text }}</pre>
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
        <b-button type="submit" variant="primary">{{ $t('form.submit') }}</b-button>
        <b-button type="reset" variant="danger">{{ $t('form.reset') }}</b-button>
      </b-form>
    </div>
  </div>
</template>
<script>
import {createContributionMessage} from '../../graphql/mutations.js'

export default {
  name: 'ContributionMessagesFormular',
  props: {
    contributionId: {
      type: Number,
      required: true,
    },
  },
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
      this.$apollo
        .mutate({
          mutation: createContributionMessage,
          variables: {
            contributionId: this.contributionId,
            message: this.form.text,
          },
        })
        .then((result) => {
          this.toastSuccess(result)
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    onReset(event) {
      event.preventDefault()
      this.form.text = ''
    },
  },
}
</script>
