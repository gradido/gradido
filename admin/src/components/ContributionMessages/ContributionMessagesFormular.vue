<template>
  <div class="contribution-messages-formular">
    <div>
      <b-form @submit="onSubmit" @reset="onReset">
        <b-form-textarea
          id="textarea"
          v-model="form.text"
          placeholder="Enter something..."
          rows="3"
          max-rows="6"
        ></b-form-textarea>
        <b-row class="mt-4 mb-6">
          <b-col>
            <b-button type="reset" variant="danger">{{ $t('form.reset') }}</b-button>
          </b-col>
          <b-col class="text-right">
            <b-button type="submit" variant="primary">{{ $t('form.submit') }}</b-button>
          </b-col>
        </b-row>
      </b-form>
    </div>
  </div>
</template>
<script>
import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'

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
          mutation: adminCreateContributionMessage,
          variables: {
            contributionId: this.contributionId,
            message: this.form.text,
          },
        })
        .then((result) => {
          this.$emit('get-list-contribution-messages', this.contributionId)
          this.form.text = ''
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
