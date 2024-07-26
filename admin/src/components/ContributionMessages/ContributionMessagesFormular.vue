<template>
  <div class="contribution-messages-formular">
    <div class="mt-5">
      <BForm @reset.prevent="onReset" @submit="onSubmit()">
        <BFormGroup>
          <BFormCheckbox v-model="showResubmissionDate">
            {{ $t('moderator.show-submission-form') }}
          </BFormCheckbox>
        </BFormGroup>
        <BFormGroup v-if="showResubmissionDate">
          <BFormInput v-model="resubmissionDate" type="date" :min="now"></BFormInput>
          <time-picker v-model="resubmissionTime"></time-picker>
        </BFormGroup>
        <BTabs v-model="tabindex" content-class="mt-3" data-test="message-type-tabs">
          <BTab active>
            <template #title>
              <span id="message-tab-title">{{ $t('moderator.message') }}</span>
              <b-tooltip target="message-tab-title" triggers="hover">
                {{ $t('moderator.message-tooltip') }}
              </b-tooltip>
            </template>
            <BFormTextarea
              id="textarea"
              v-model="form.text"
              :placeholder="$t('contributionLink.memo')"
              rows="3"
            ></BFormTextarea>
          </BTab>
          <BTab>
            <template #title>
              <span id="notice-tab-title">{{ $t('moderator.notice') }}</span>
              <BTooltip target="notice-tab-title" triggers="hover">
                {{ $t('moderator.notice-tooltip') }}
              </BTooltip>
            </template>
            <BFormTextarea
              id="textarea"
              v-model="form.text"
              :placeholder="$t('moderator.notice')"
              rows="3"
            ></BFormTextarea>
          </BTab>
          <BTab>
            <template #title>
              <span id="memo-tab-title">{{ $t('moderator.memo') }}</span>
              <BTooltip target="memo-tab-title" triggers="hover">
                {{ $t('moderator.memo-tooltip') }}
              </BTooltip>
            </template>
            <BFormTextarea
              id="textarea"
              v-model="form.memo"
              :placeholder="$t('contributionLink.memo')"
              rows="3"
            ></BFormTextarea>
          </BTab>
        </BTabs>
        <BRow class="mt-4 mb-6">
          <BCol>
            <BButton type="reset" variant="danger">{{ $t('form.cancel') }}</BButton>
          </BCol>
          <BCol class="text-right">
            <BButton
              type="submit"
              variant="primary"
              :disabled="disabled"
              data-test="submit-dialog"
              @click.prevent="onSubmit()"
            >
              {{ $t('save') }}
            </BButton>
          </BCol>
        </BRow>
      </BForm>
    </div>
  </div>
</template>
<!--<script>-->
<!--import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'-->
<!--import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'-->
<!--import TimePicker from '@/components/input/TimePicker'-->

<!--export default {-->
<!--  name: 'ContributionMessagesFormular',-->
<!--  components: {-->
<!--    TimePicker,-->
<!--  },-->
<!--  props: {-->
<!--    contributionId: {-->
<!--      type: Number,-->
<!--      required: true,-->
<!--    },-->
<!--    contributionMemo: {-->
<!--      type: String,-->
<!--      required: true,-->
<!--    },-->
<!--    hideResubmission: {-->
<!--      type: Boolean,-->
<!--      required: true,-->
<!--    },-->
<!--    inputResubmissionDate: {-->
<!--      type: String,-->
<!--      required: false,-->
<!--    },-->
<!--  },-->
<!--  emits: [-->
<!--    'update-contribution',-->
<!--    'update-contributions',-->
<!--    'get-contribution',-->
<!--    'update-status',-->
<!--    'get-list-contribution-messages',-->
<!--  ],-->
<!--  data() {-->
<!--    const localInputResubmissionDate = this.inputResubmissionDate-->
<!--      ? new Date(this.inputResubmissionDate)-->
<!--      : null-->

<!--    return {-->
<!--      form: {-->
<!--        text: '',-->
<!--        memo: this.contributionMemo,-->
<!--      },-->
<!--      loading: false,-->
<!--      resubmissionDate: localInputResubmissionDate,-->
<!--      resubmissionTime: localInputResubmissionDate-->
<!--        ? localInputResubmissionDate.toLocaleTimeString('de-DE', {-->
<!--            hour: '2-digit',-->
<!--            minute: '2-digit',-->
<!--          })-->
<!--        : '00:00',-->
<!--      showResubmissionDate: localInputResubmissionDate !== null,-->
<!--      tabindex: 0, // 0 = Chat, 1 = Notice, 2 = Memo-->
<!--      messageType: {-->
<!--        DIALOG: 'DIALOG',-->
<!--        MODERATOR: 'MODERATOR',-->
<!--      },-->
<!--    }-->
<!--  },-->
<!--  computed: {-->
<!--    disabled() {-->
<!--      return (-->
<!--        (this.chatOrMemo === 0 && this.form.text === '') ||-->
<!--        this.loading ||-->
<!--        (this.chatOrMemo === 1 && this.form.memo.length < 5) ||-->
<!--        (this.showResubmissionDate && !this.resubmissionDate)-->
<!--      )-->
<!--    },-->
<!--    moderatorDisabled() {-->
<!--      return this.form.text === '' || this.loading || this.chatOrMemo === 1-->
<!--    },-->
<!--    now() {-->
<!--      return new Date()-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    combineResubmissionDateAndTime() {-->
<!--      // getTimezoneOffset-->
<!--      const formattedDate = new Date(this.resubmissionDate)-->
<!--      const [hours, minutes] = this.resubmissionTime.split(':')-->
<!--      formattedDate.setHours(parseInt(hours))-->
<!--      formattedDate.setMinutes(parseInt(minutes))-->
<!--      return formattedDate-->
<!--    },-->
<!--    utcResubmissionDateTime() {-->
<!--      if (!this.resubmissionDate) return null-->
<!--      const localResubmissionDateAndTime = this.combineResubmissionDateAndTime()-->
<!--      return new Date(-->
<!--        localResubmissionDateAndTime.getTime() +-->
<!--          localResubmissionDateAndTime.getTimezoneOffset() * 60000,-->
<!--      )-->
<!--    },-->
<!--    onSubmit() {-->
<!--      this.loading = true-->
<!--      let mutation-->
<!--      let updateOnlyResubmissionAt = false-->
<!--      const resubmissionAtDate = this.showResubmissionDate-->
<!--        ? this.combineResubmissionDateAndTime()-->
<!--        : null-->
<!--      const variables = {-->
<!--        resubmissionAt: resubmissionAtDate ? resubmissionAtDate.toString() : null,-->
<!--      }-->
<!--      // update only resubmission date?-->
<!--      if (this.form.text === '' && this.form.memo === this.contributionMemo) {-->
<!--        mutation = adminUpdateContribution-->
<!--        variables.id = this.contributionId-->
<!--        updateOnlyResubmissionAt = true-->
<!--      }-->
<!--      // update tabindex 0 = dialog or 1 = moderator-->
<!--      else if (this.tabindex !== 2) {-->
<!--        mutation = adminCreateContributionMessage-->
<!--        variables.message = this.form.text-->
<!--        variables.messageType =-->
<!--          this.tabindex === 0 ? this.messageType.DIALOG : this.messageType.MODERATOR-->
<!--        variables.contributionId = this.contributionId-->
<!--        // update contribution memo, tabindex 2-->
<!--      } else {-->
<!--        mutation = adminUpdateContribution-->
<!--        variables.memo = this.form.memo-->
<!--        variables.id = this.contributionId-->
<!--      }-->
<!--      if (this.showResubmissionDate && resubmissionAtDate < new Date()) {-->
<!--        this.toastError(this.$t('contributionMessagesForm.resubmissionDateInPast'))-->
<!--        this.loading = false-->
<!--        return-->
<!--      }-->
<!--      this.$apollo-->
<!--        .mutate({ mutation, variables })-->
<!--        .then((result) => {-->
<!--          if (-->
<!--            (this.hideResubmission &&-->
<!--              this.showResubmissionDate &&-->
<!--              resubmissionAtDate > new Date()) ||-->
<!--            this.tabindex === 2-->
<!--          ) {-->
<!--            this.$emit('update-contributions')-->
<!--          } else {-->
<!--            this.$emit('get-list-contribution-messages', this.contributionId)-->
<!--            // update status increase message count and update chat symbol-->
<!--            // if (updateOnlyResubmissionAt === true) no message was created-->
<!--            if (!updateOnlyResubmissionAt) {-->
<!--              this.$emit('update-status', this.contributionId)-->
<!--            }-->
<!--          }-->
<!--          this.toastSuccess(this.$t('message.request'))-->
<!--          this.loading = false-->
<!--        })-->
<!--        .catch((error) => {-->
<!--          this.toastError(error.message)-->
<!--          this.loading = false-->
<!--        })-->
<!--    },-->
<!--    onReset(event) {-->
<!--      this.form.text = ''-->
<!--      this.form.memo = this.contributionMemo-->
<!--      this.showResubmissionDate = false-->
<!--      this.resubmissionDate = this.inputResubmissionDate-->
<!--      this.resubmissionTime = this.inputResubmissionDate-->
<!--        ? new Date(this.inputResubmissionDate).toLocaleTimeString('de-DE', {-->
<!--            hour: '2-digit',-->
<!--            minute: '2-digit',-->
<!--          })-->
<!--        : '00:00'-->
<!--      this.showResubmissionDate =-->
<!--        this.inputResubmissionDate !== undefined && this.inputResubmissionDate !== null-->
<!--    },-->
<!--    enableMemo() {-->
<!--      this.chatOrMemo = 1-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->

<script setup>
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'

import TimePicker from '@/components/input/TimePicker'
import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'
import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
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
})

const emit = defineEmits([
  'update-contribution',
  'update-contributions',
  'get-contribution',
  'update-status',
  'get-list-contribution-messages',
])

const { t } = useI18n()
const { toastError, toastSuccess } = useAppToast()

const form = ref({
  text: '',
  memo: props.contributionMemo,
})
const loading = ref(false)

const localInputResubmissionDate = props.inputResubmissionDate
  ? new Date(props.inputResubmissionDate)
  : null
const resubmissionDate = ref(localInputResubmissionDate)
const resubmissionTime = ref(
  localInputResubmissionDate
    ? localInputResubmissionDate.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '00:00',
)
const showResubmissionDate = ref(localInputResubmissionDate !== null)
const tabindex = ref(0) // 0 = Chat, 1 = Notice, 2 = Memo
const messageType = {
  DIALOG: 'DIALOG',
  MODERATOR: 'MODERATOR',
}

const disabled = computed(() => {
  return (
    (tabindex.value === 0 && form.value.text === '') ||
    loading.value ||
    (tabindex.value === 1 && form.value.memo.length < 5) ||
    (showResubmissionDate.value && !resubmissionDate.value)
  )
})

// const moderatorDisabled = computed(() => {
//   return form.value.text === '' || loading.value || tabindex.value === 1
// })

const now = computed(() => new Date())

const { mutate: createContributionMessageMutation } = useMutation(adminCreateContributionMessage)
const { mutate: updateContributionMutation } = useMutation(adminUpdateContribution)

const combineResubmissionDateAndTime = () => {
  const formattedDate = new Date(resubmissionDate.value)
  const [hours, minutes] = resubmissionTime.value.split(':')
  formattedDate.setHours(parseInt(hours))
  formattedDate.setMinutes(parseInt(minutes))
  return formattedDate
}

// const utcResubmissionDateTime = () => {
//   if (!resubmissionDate.value) return null
//   const localResubmissionDateAndTime = combineResubmissionDateAndTime()
//   return new Date(
//     localResubmissionDateAndTime.getTime() +
//       localResubmissionDateAndTime.getTimezoneOffset() * 60000,
//   )
// }

const onSubmit = () => {
  loading.value = true
  let mutation
  let updateOnlyResubmissionAt = false
  const resubmissionAtDate = showResubmissionDate.value ? combineResubmissionDateAndTime() : null
  const variables = {
    resubmissionAt: resubmissionAtDate ? resubmissionAtDate.toString() : null,
  }

  if (form.value.text === '' && form.value.memo === props.contributionMemo) {
    mutation = updateContributionMutation
    variables.id = props.contributionId
    updateOnlyResubmissionAt = true
  } else if (tabindex.value !== 2) {
    mutation = createContributionMessageMutation
    variables.message = form.value.text
    variables.messageType = tabindex.value === 0 ? messageType.DIALOG : messageType.MODERATOR
    variables.contributionId = props.contributionId
  } else {
    mutation = updateContributionMutation
    variables.memo = form.value.memo
    variables.id = props.contributionId
  }

  if (showResubmissionDate.value && resubmissionAtDate < new Date()) {
    toastError(t('contributionMessagesForm.resubmissionDateInPast'))
    loading.value = false
    return
  }

  mutation({ variables })
    .then(() => {
      if (
        (props.hideResubmission && showResubmissionDate.value && resubmissionAtDate > new Date()) ||
        tabindex.value === 2
      ) {
        emit('update-contributions')
      } else {
        emit('get-list-contribution-messages', props.contributionId)
        if (!updateOnlyResubmissionAt) {
          emit('update-status', props.contributionId)
        }
      }
      toastSuccess(t('message.request'))
      loading.value = false
    })
    .catch((error) => {
      toastError(error.message)
      loading.value = false
    })
}

const onReset = () => {
  form.value.text = ''
  form.value.memo = props.contributionMemo
  showResubmissionDate.value = false
  resubmissionDate.value = props.inputResubmissionDate
  resubmissionTime.value = props.inputResubmissionDate
    ? new Date(props.inputResubmissionDate).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '00:00'
  showResubmissionDate.value =
    props.inputResubmissionDate !== undefined && props.inputResubmissionDate !== null
}

// const enableMemo = () => {
//   tabindex.value = 1
// }
</script>
