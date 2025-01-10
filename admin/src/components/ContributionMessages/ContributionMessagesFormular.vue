<template>
  <div class="contribution-messages-formular">
    <div class="mt-5">
      <BForm @reset.prevent="onReset" @submit="onSubmit()">
        <BFormGroup>
          <BFormCheckbox v-model="showResubmissionDate">
            {{ $t('moderator.show-submission-form') }}
          </BFormCheckbox>
        </BFormGroup>
        <BFormGroup v-if="showResubmissionDate" class="d-flex my-2" group-class="custom-wrapper">
          <Datepicker v-model="resubmissionDate" type="date" :lower-limit="now"></Datepicker>
          <time-picker v-model="resubmissionTime"></time-picker>
        </BFormGroup>
        <BTabs v-model="tabindex" content-class="mt-3" data-test="message-type-tabs">
          <BTab active>
            <template #title>
              <span id="message-tab-title">{{ $t('moderator.message') }}</span>
              <BTooltip target="message-tab-title" triggers="hover">
                {{ $t('moderator.message-tooltip') }}
              </BTooltip>
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
          <BCol class="text-end">
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

<script setup>
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'

import Datepicker from 'vue3-datepicker'
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

  mutation({ ...variables })
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
</script>
