<template>
  <div class="contribution-messages-formular">
    <div class="mt-5">
      <b-form @submit.prevent="onSubmit" @reset.prevent="onReset">
        <b-form-textarea
          id="textarea"
          v-model="form.text"
          :placeholder="$t('contributionLink.memo')"
          rows="3"
        ></b-form-textarea>
        <b-row class="mt-4 mb-6">
          <b-col>
            <b-button type="reset" variant="danger">{{ $t('form.cancel') }}</b-button>
          </b-col>
          <b-col class="text-right">
            <b-button type="submit" variant="primary" :disabled="disabled">
              {{ $t('form.submit') }}
            </b-button>
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
        text: ''
      },
    }
  },
  methods: {
    onSubmit(event) {
      this.$apollo
        .mutate({
          mutation: adminCreateContributionMessage,
          variables: {
            contributionId: this.contributionId,
            message: this.clearTextFromHtml,
          },
        })
        .then((result) => {
          this.$emit('get-list-contribution-messages', this.contributionId)
          this.$emit('update-state', this.contributionId)
          this.form.text = ''
          this.toastSuccess(this.$t('message.request'))
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    onReset(event) {
      this.form.text = ''
    },
  },
  computed: {
    clearTextFromHtml(){
      return this.form.text.replace(/(<([^>]+)>)/gi, '')
    },
    disabled() {
      if (this.form.text !== '') {
        return false
      }
      return true
    },
  },
}
</script>
