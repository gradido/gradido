<template>
  <div class="contribution-messages-formular">
    <div>
      <b-form @submit.prevent="onSubmit" @reset="onReset">
        <b-form-textarea
          id="textarea"
          v-model="form.text"
          :placeholder="$t('form.memo')"
          rows="3"
        ></b-form-textarea>
        <b-row class="mt-4 mb-6">
          <b-col>
            <b-button type="reset" variant="danger">{{ $t('form.cancel') }}</b-button>
          </b-col>
          <b-col class="text-right">
            <b-button type="submit" variant="primary" :disabled="disabled">
              {{ $t('form.reply') }}
            </b-button>
          </b-col>
        </b-row>
      </b-form>
    </div>
  </div>
</template>
<script>
import { createContributionMessage } from '../../graphql/mutations.js'

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
      isSubmitting: false,
    }
  },
  methods: {
    onSubmit() {
      this.isSubmitting = true
      this.$apollo
        .mutate({
          mutation: createContributionMessage,
          variables: {
            contributionId: this.contributionId,
            message: this.form.text,
          },
        })
        .then((result) => {
          this.$emit('get-list-contribution-messages', false)
          this.$emit('update-state', this.contributionId)
          this.form.text = ''
          this.toastSuccess(this.$t('message.reply'))
          this.isSubmitting = false
        })
        .catch((error) => {
          this.toastError(error.message)
          this.isSubmitting = false
        })
    },
    onReset() {
      this.form.text = ''
    },
  },
  computed: {
    disabled() {
      return this.form.text === '' || this.isSubmitting
    },
  },
}
</script>
