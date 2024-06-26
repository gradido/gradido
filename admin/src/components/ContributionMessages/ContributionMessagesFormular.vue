<template>
  <div class="contribution-messages-formular">
    <div class="mt-5">
      <b-form @reset.prevent="onReset" @submit="onSubmit()">
        <b-form-group>
          <b-form-checkbox v-model="showResubmissionDate">
            {{ $t('moderator.show-submission-form') }}
          </b-form-checkbox>
        </b-form-group>
        <b-form-group v-if="showResubmissionDate">
          <b-form-datepicker v-model="resubmissionDate" :min="now"></b-form-datepicker>
          <time-picker v-model="resubmissionTime"></time-picker>
        </b-form-group>
        <b-tabs content-class="mt-3" v-model="tabindex" data-test="message-type-tabs">
          <b-tab active>
            <template #title>
              <span id="message-tab-title">{{ $t('moderator.message') }}</span>
              <b-tooltip target="message-tab-title" triggers="hover">
                {{ $t('moderator.message-tooltip') }}
              </b-tooltip>
            </template>
            <b-form-textarea
              id="textarea"
              v-model="form.text"
              :placeholder="$t('contributionLink.memo')"
              rows="3"
            ></b-form-textarea>
          </b-tab>
          <b-tab>
            <template #title>
              <span id="notice-tab-title">{{ $t('moderator.notice') }}</span>
              <b-tooltip target="notice-tab-title" triggers="hover">
                {{ $t('moderator.notice-tooltip') }}
              </b-tooltip>
            </template>
            <b-form-textarea
              id="textarea"
              v-model="form.text"
              :placeholder="$t('moderator.notice')"
              rows="3"
            ></b-form-textarea>
          </b-tab>
          <b-tab>
            <template #title>
              <span id="memo-tab-title">{{ $t('moderator.memo') }}</span>
              <b-tooltip target="memo-tab-title" triggers="hover">
                {{ $t('moderator.memo-tooltip') }}
              </b-tooltip>
            </template>
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
          <b-col class="text-right">
            <b-button
              type="submit"
              variant="primary"
              :disabled="disabled"
              @click.prevent="onSubmit()"
              data-test="submit-dialog"
            >
              {{ $t('save') }}
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
    inputResubmissionDate: {
      type: String,
      required: false,
    },
  },
  data() {
    const localInputResubmissionDate = this.inputResubmissionDate
      ? new Date(this.inputResubmissionDate)
      : null

    return {
      form: {
        text: '',
        memo: this.contributionMemo,
      },
      loading: false,
      resubmissionDate: localInputResubmissionDate,
      resubmissionTime: localInputResubmissionDate
        ? localInputResubmissionDate.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '00:00',
      showResubmissionDate: localInputResubmissionDate !== null,
      tabindex: 0, // 0 = Chat, 1 = Notice, 2 = Memo
      messageType: {
        DIALOG: 'DIALOG',
        MODERATOR: 'MODERATOR',
      },
    }
  },
  methods: {
    combineResubmissionDateAndTime() {
      // getTimezoneOffset
      const formattedDate = new Date(this.resubmissionDate)
      const [hours, minutes] = this.resubmissionTime.split(':')
      formattedDate.setHours(parseInt(hours))
      formattedDate.setMinutes(parseInt(minutes))
      return formattedDate
    },
    utcResubmissionDateTime() {
      if (!this.resubmissionDate) return null
      const localResubmissionDateAndTime = this.combineResubmissionDateAndTime()
      return new Date(
        localResubmissionDateAndTime.getTime() +
          localResubmissionDateAndTime.getTimezoneOffset() * 60000,
      )
    },
    onSubmit() {
      this.loading = true
      let mutation
      let updateOnlyResubmissionAt = false
      const resubmissionAtDate = this.showResubmissionDate
        ? this.combineResubmissionDateAndTime()
        : null
      const variables = {
        resubmissionAt: resubmissionAtDate ? resubmissionAtDate.toString() : null,
      }
      // update only resubmission date?
      if (this.form.text === '' && this.form.memo === this.contributionMemo) {
        mutation = adminUpdateContribution
        variables.id = this.contributionId
        updateOnlyResubmissionAt = true
      }
      // update tabindex 0 = dialog or 1 = moderator
      else if (this.tabindex !== 2) {
        mutation = adminCreateContributionMessage
        variables.message = this.form.text
        variables.messageType =
          this.tabindex === 0 ? this.messageType.DIALOG : this.messageType.MODERATOR
        variables.contributionId = this.contributionId
        // update contribution memo, tabindex 2
      } else {
        mutation = adminUpdateContribution
        variables.memo = this.form.memo
        variables.id = this.contributionId
      }
      if (this.showResubmissionDate && resubmissionAtDate < new Date()) {
        this.toastError(this.$t('contributionMessagesForm.resubmissionDateInPast'))
        this.loading = false
        return
      }
      this.$apollo
        .mutate({ mutation, variables })
        .then((result) => {
          if (
            (this.hideResubmission &&
              this.showResubmissionDate &&
              resubmissionAtDate > new Date()) ||
            this.tabindex === 2
          ) {
            this.$emit('update-contributions')
          } else {
            this.$emit('get-list-contribution-messages', this.contributionId)
            // update status increase message count and update chat symbol
            // if (updateOnlyResubmissionAt === true) no message was created
            if (!updateOnlyResubmissionAt) {
              this.$emit('update-status', this.contributionId)
            }
          }
          this.toastSuccess(this.$t('message.request'))
          this.loading = false
        })
        .catch((error) => {
          this.toastError(error.message)
          this.loading = false
        })
    },
    onReset(event) {
      this.form.text = ''
      this.form.memo = this.contributionMemo
      this.showResubmissionDate = false
      this.resubmissionDate = this.inputResubmissionDate
      this.resubmissionTime = this.inputResubmissionDate
        ? new Date(this.inputResubmissionDate).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '00:00'
      this.showResubmissionDate =
        this.inputResubmissionDate !== undefined && this.inputResubmissionDate !== null
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
        (this.chatOrMemo === 1 && this.form.memo.length < 5) ||
        (this.showResubmissionDate && !this.resubmissionDate)
      )
    },
    moderatorDisabled() {
      return this.form.text === '' || this.loading || this.chatOrMemo === 1
    },
    now() {
      return new Date()
    },
  },
}
</script>
