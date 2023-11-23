<template>
  <div class="contribution-messages-formular">
    <div class="mt-5">
      <b-form @reset.prevent="onReset" @submit="onSubmit(messageType.DIALOG)">
        <b-tabs content-class="mt-3" v-model="chatOrMemo">
          <b-tab :title="$t('moderator.chat')" active>
            <b-form-group>
              <b-form-checkbox v-model="showResubmissionDate">
                {{ $t('moderator.show-submission-form') }}
              </b-form-checkbox>
            </b-form-group>
            <b-form-group v-if="showResubmissionDate">
              <b-form-datepicker v-model="resubmissionDate"></b-form-datepicker>
              <time-picker v-model="resubmissionTime"></time-picker>
            </b-form-group>
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
import TimePicker from '@/components/input/TimePicker'

export default {
  components: {
    TimePicker,
  },
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
    hideResubmission: {
      type: Boolean,
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
      resubmissionDate: null,
      resubmissionTime: '00:00',
      showResubmissionDate: false,
      chatOrMemo: 0, // 0 = Chat, 1 = Memo
      messageType: {
        DIALOG: 'DIALOG',
        MODERATOR: 'MODERATOR',
      },
    }
  },
  methods: {
    combineResubmissionDateAndTime() {
      if (this.resubmissionDate) {
        const formattedDate = new Date(this.resubmissionDate)
        const [hours, minutes] = this.resubmissionTime.split(':')
        formattedDate.setHours(parseInt(hours))
        formattedDate.setMinutes(parseInt(minutes))
        return formattedDate
      } else {
        return null
      }
    },
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
              resubmissionAt: this.showResubmissionDate
                ? this.combineResubmissionDateAndTime().toString()
                : null,
            },
          })
          .then((result) => {
            if (
              this.hideResubmission &&
              this.showResubmissionDate &&
              this.combineResubmissionDateAndTime() > new Date()
            ) {
              this.$emit('update-contributions')
            } else {
              this.$emit('get-list-contribution-messages', this.contributionId)
              this.$emit('update-status', this.contributionId)
            }
            this.onReset()
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
      this.showResubmissionDate = false
      this.resubmissionDate = null
      this.resubmissionTime = '00:00'
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
