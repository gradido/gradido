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
          <div class="d-flex my-2">
            <Datepicker
              v-model="resubmissionDate"
              :locale="dateLocale"
              input-format="P"
              :lower-limit="now"
              class="form-control"
            />
            <time-picker v-model="resubmissionTime" class="ms-2" />
          </div>
        </BFormGroup>
        <div v-if="showCreaInsert || showCreaAppend" class="mt-3 d-flex gap-2 align-items-center">
          <img
            v-if="showCreaInsert"
            src="../../../public/img/crea-logo.jpg"
            :alt="$t('crea.column')"
            class="crea-inline-logo"
          />
          <BButton
            v-if="showCreaInsert"
            variant="outline-info"
            size="sm"
            data-test="crea-insert-draft"
            @click="insertCreaDraft"
          >
            {{ $t('crea.insertDraft') }}
          </BButton>
          <BButton
            v-if="showCreaAppend"
            variant="outline-info"
            size="sm"
            data-test="crea-append-memo"
            @click="appendCreaSupplement"
          >
            {{ $t('crea.appendToMemo') }}
          </BButton>
        </div>
        <BTabs v-model="tabindex" class="mt-3" content-class="mt-3" data-test="message-type-tabs">
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
              rows="12"
              @keydown="onTextKeydown"
              @focus="captureCreaField"
            />
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
              rows="12"
              @keydown="onTextKeydown"
              @focus="captureCreaField"
            />
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
              rows="12"
              @keydown="onMemoKeydown"
            />
            <p v-if="memoTooLong" class="mt-1 mb-0 text-danger small">
              {{ $t('crea.memoTooLong', { max: MEMO_MAX_LENGTH }) }}
            </p>
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
import { ref, computed, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useDateLocale } from '@/composables/useDateLocale'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import Datepicker from 'vue3-datepicker'
import TimePicker from '@/components/input/TimePicker'
import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'
import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'
import { useAppToast } from '@/composables/useToast'
import { useBoldShortcut } from '@/composables/useBoldShortcut'
import { useCreaClipboard } from '@/composables/useCreaClipboard'
import { useCreaSupplement } from '@/composables/useCreaSupplement'

// The memo (the public contribution text) is limited to 512 chars in the backend
// (migration 0093). We warn and block the save past it rather than auto-cutting — per
// E-019 the moderator shortens the original himself (append-only, no auto-truncation).
const MEMO_MAX_LENGTH = 512
// The moderator comment marker appended to the public contribution (E-019). The 💬 and
// the dash are content, not code; the dash sets the note off within the running text
// (Bernd: these memos use no blank lines).
const MEMO_MARKER = '💬'
const MEMO_SEPARATOR = ' – '

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
  'resubmission-saved',
])

const { t } = useI18n()
const store = useStore()
const dateLocale = useDateLocale()
const { toastError, toastSuccess } = useAppToast()
const form = ref({
  text: '',
  memo: props.contributionMemo,
})
const loading = ref(false)

// Cmd/Ctrl+B bold shortcut for the moderator message fields (rendered on display).
const { onKeydown: onTextKeydown } = useBoldShortcut(
  () => form.value.text,
  (value) => {
    form.value.text = value
  },
)
const { onKeydown: onMemoKeydown } = useBoldShortcut(
  () => form.value.memo,
  (value) => {
    form.value.memo = value
  },
)

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

// Crea's last reply draft (held in the browser) drops into the message field with one
// click - no OS clipboard needed inside the admin. Only on the message/note tabs
// (tabs 0/1 both bind form.text); the memo tab (2) edits the member's own text.
const { lastResponse } = useCreaClipboard()
const creaTextAreaEl = ref(null)
const captureCreaField = (event) => {
  creaTextAreaEl.value = event.target
}
const showCreaInsert = computed(() => Boolean(lastResponse.value) && tabindex.value !== 2)
const insertCreaDraft = async () => {
  const draft = lastResponse.value
  if (!draft) {
    return
  }
  const current = form.value.text
  const el = creaTextAreaEl.value
  if (!current) {
    // Empty field: just fill it.
    form.value.text = draft
    return
  }
  if (el) {
    // Non-empty: splice in at the caret. A textarea keeps its selection even after the
    // button takes focus, so the moderator's cursor position still applies.
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? start
    form.value.text = current.slice(0, start) + draft + current.slice(end)
    await nextTick()
    const caret = start + draft.length
    el.focus()
    el.setSelectionRange(caret, caret)
  } else {
    // Never focused: append below what is there.
    form.value.text = `${current}\n${draft}`
  }
}

// Crea's public note for a confirmed contribution (E-019) drops into the memo (the
// community-visible "Text ändern" tab) with one click. Twin of insertCreaDraft: shown
// whenever a note is stored, on any tab (it switches to the memo tab itself).
const { lastSupplement } = useCreaSupplement()
const showCreaAppend = computed(() => Boolean(lastSupplement.value))
const appendCreaSupplement = () => {
  const supplement = lastSupplement.value
  if (!supplement) {
    return
  }
  // The 💬 + first-name marker is built here, locally — the moderator's name never
  // reached the AI (like [ANREDE]/[SIGNATUR]). append-only: the original text is untouched.
  const firstName = store.state.moderator?.firstName ?? ''
  const marker = firstName
    ? `${MEMO_MARKER} ${firstName}: ${supplement}`
    : `${MEMO_MARKER} ${supplement}`
  const current = form.value.memo.trim()
  form.value.memo = current ? `${current}${MEMO_SEPARATOR}${marker}` : marker
  // Switch to the memo tab so the moderator reads the result in place and saves it (E-005).
  tabindex.value = 2
}

const isTextTabValid = computed(() => form.value.text !== '')

// Also block the save past the memo limit so the moderator shortens before saving
// (the warning under the field explains why); no auto-truncation (E-019).
const memoTooLong = computed(() => form.value.memo.length > MEMO_MAX_LENGTH)
const isMemoTabValid = computed(
  () => form.value.memo.length >= 5 && form.value.memo.length <= MEMO_MAX_LENGTH,
)

// Removing an existing reminder (the checkbox unchecked on a contribution that had one)
// is a valid save even without a message -- otherwise a reminder could never be
// withdrawn. inputResubmissionDate reflects the persisted state, so it stays truthy
// while the moderator unchecks the box, until the save + refetch clears it.
const isRemovingResubmission = computed(
  () => !showResubmissionDate.value && !!props.inputResubmissionDate,
)

const disabled = computed(
  () =>
    loading.value ||
    (!(showResubmissionDate.value && resubmissionDate.value) &&
      !isRemovingResubmission.value &&
      ([0, 1].includes(tabindex.value)
        ? !isTextTabValid.value
        : tabindex.value === 2
          ? !isMemoTabValid.value
          : false)),
)

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
      // Signal a saved reminder change up to the page, which may offer to apply it to
      // all displayed contributions of this participant (bulk resubmission). Fires both
      // when a date is set and when an existing reminder is removed; carries this
      // contribution's id so the bulk loop can skip the row that was just saved here.
      if ((showResubmissionDate.value && resubmissionAtDate) || isRemovingResubmission.value) {
        emit('resubmission-saved', {
          id: props.contributionId,
          resubmissionAt: resubmissionAtDate ? resubmissionAtDate.toString() : null,
          unchanged: false,
        })
      }
      toastSuccess(t('message.request'))
      form.value = {
        text: '',
        memo: props.contributionMemo,
      }
      loading.value = false
    })
    .catch((error) => {
      // A pure resubmission "save" that changes nothing -- the reminder already holds
      // this exact date, or there is no reminder to add or remove -- makes the backend
      // throw "wasn't changed". Not a real failure: signal it up marked unchanged
      // instead of a red error. The page then offers to propagate an existing reminder
      // to the group, or shows a neutral notice when there is nothing to spread.
      if (updateOnlyResubmissionAt && error.message?.includes("wasn't changed")) {
        emit('resubmission-saved', {
          id: props.contributionId,
          resubmissionAt: resubmissionAtDate ? resubmissionAtDate.toString() : null,
          unchanged: true,
        })
        loading.value = false
        return
      }
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

<style scoped>
.crea-inline-logo {
  display: block;
  width: 26px;
  height: 26px;
  object-fit: cover;
  border-radius: 22%;
}
</style>
