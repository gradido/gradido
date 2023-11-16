<template>
  <div class="contribution-messages-formular">
    <div class="mt-5">
      <b-form @reset.prevent="onReset" @submit="onSubmit(messageType.DIALOG)">
        <b-tabs content-class="mt-3" v-model="chatOrMemo">
          <b-tab :title="$t('moderator.chat')" active>
            <b-form-textarea
              id="textarea"
              v-model="form.text"
              :placeholder="$t('contributionLink.memo')"
              rows="3"
            ></b-form-textarea>
          </b-tab>
          <b-tab :title="$t('moderator.memo')">
            <b-form-textarea
              id="textarea"
              v-model="form.memo"
              :placeholder="$t('contributionLink.memo')"
              rows="3"
            ></b-form-textarea>
          </b-tab>
        </b-tabs>
        <b-row class="mt-4 mb-6">
          <b-col>
            <b-button type="reset" variant="danger">{{ $t('form.cancel') }}</b-button>
          </b-col>
          <b-col class="text-center">
            <b-button
              type="button"
              variant="warning"
              class="text-black"
              @click.prevent="enableMemo()"
              data-test="submit-memo"
            >
              {{ $t('moderator.memo-modify') }}
            </b-button>
            <b-button
              type="button"
              variant="warning"
              class="text-black"
              :disabled="moderatorDisabled"
              @click.prevent="onSubmit(messageType.MODERATOR)"
              data-test="submit-moderator"
            >
              {{ $t('moderator.notice') }}
            </b-button>
          </b-col>

          <b-col class="text-right">
            <b-button
              type="submit"
              variant="primary"
              :disabled="disabled"
              @click.prevent="onSubmit(messageType.DIALOG)"
              data-test="submit-dialog"
            >
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
import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'

export default {
  name: 'ContributionMessagesFormular',
  props: {
    contributionId: {
      type: Number,
      required: true,
    },
    contributionMemo: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      form: {
        text: '',
        memo: this.contributionMemo,
      },
      loading: false,
      chatOrMemo: 0, // 0 = Chat, 1 = Memo
      messageType: {
        DIALOG: 'DIALOG',
        MODERATOR: 'MODERATOR',
      },
    }
  },
  methods: {
    onSubmit(mType) {
      this.loading = true
      if (this.chatOrMemo === 0) {
        this.$apollo
          .mutate({
            mutation: adminCreateContributionMessage,
            variables: {
              contributionId: this.contributionId,
              message: this.form.text,
              messageType: mType,
            },
          })
          .then((result) => {
            this.$emit('get-list-contribution-messages', this.contributionId)
            this.$emit('update-status', this.contributionId)
            this.form.text = ''
            this.toastSuccess(this.$t('message.request'))
            this.loading = false
          })
          .catch((error) => {
            this.toastError(error.message)
            this.loading = false
          })
      } else {
        this.$apollo
          .mutate({
            mutation: adminUpdateContribution,
            variables: {
              id: this.contributionId,
              memo: this.form.memo,
            },
          })
          .then((result) => {
            this.$emit('get-list-contribution-messages', this.contributionId)
            this.$emit('update-status', this.contributionId)
            this.$emit('reload-contribution', this.contributionId)
            this.toastSuccess(this.$t('message.request'))
            this.loading = false
          })
          .catch((error) => {
            this.toastError(error.message)
            this.loading = false
          })
      }
    },
    onReset(event) {
      this.form.text = ''
      this.form.memo = this.contributionMemo 
    },
    enableMemo() {
      this.chatOrMemo = 1
    },
  },
  computed: {
    disabled() {
      return (
        (this.chatOrMemo === 0 && this.form.text === '') ||
        this.loading ||
        (this.chatOrMemo === 1 && this.form.memo.length < 5)
      )
    },
    moderatorDisabled() {
      return this.form.text === '' || this.loading || this.chatOrMemo === 1
    },
  },
}
</script>
