// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import {
  BButton,
  BCol,
  BForm,
  BFormCheckbox,
  BFormGroup,
  BFormTextarea,
  BRow,
  BTab,
  BTabs,
  BTooltip,
} from 'bootstrap-vue-next'
import { computed, defineComponent, nextTick, type PropType, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import Datepicker from 'vue3-datepicker'
import { TimePicker } from '@/components/input/TimePicker'
import { useBoldShortcut } from '@/composables/useBoldShortcut'
import { useCreaClipboard } from '@/composables/useCreaClipboard'
import { useCreaSupplement } from '@/composables/useCreaSupplement'
import { useDateLocale } from '@/composables/useDateLocale'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'
import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'
import { useAdminStore } from '@/store/useAdminStore'
import creaLogo from '../../../public/img/crea-logo.jpg'
import classes from './ContributionMessagesFormular.module.css'

// The memo (the public contribution text) is limited to 512 chars in the backend
// (migration 0093). We warn and block the save past it rather than auto-cutting — per
// E-019 the moderator shortens the original himself (append-only, no auto-truncation).
const MEMO_MAX_LENGTH = 512
// The moderator comment marker appended to the public contribution (E-019). The 💬 and
// the dash are content, not code; the dash sets the note off within the running text
// (Bernd: these memos use no blank lines).
const MEMO_MARKER = '💬'
const MEMO_SEPARATOR = ' – '

export const ContributionMessagesFormular = defineComponent({
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
      type: String as PropType<string | null>,
      required: false,
    },
  },
  emits: [
    'update-contribution',
    'update-contributions',
    'get-contribution',
    'update-status',
    'get-list-contribution-messages',
    'resubmission-saved',
  ],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useAdminStore()
    const dateLocale = useDateLocale()
    // Half the rows on a phone: twelve would push the save button out of a short window.
    const viewport = useViewport()
    const textRows = computed(() => (viewport.value === 'mobile' ? 6 : 12))
    const { toastError, toastSuccess } = useAppToast()
    const form = ref({
      text: '',
      memo: props.contributionMemo,
    })
    const loading = ref(false)

    // Cmd/Ctrl+B bold shortcut for the moderator message fields (rendered on display).
    const { onKeydown: onTextKeydown } = useBoldShortcut(
      () => form.value.text,
      (value: string) => {
        form.value.text = value
      },
    )
    const { onKeydown: onMemoKeydown } = useBoldShortcut(
      () => form.value.memo,
      (value: string) => {
        form.value.memo = value
      },
    )

    const localInputResubmissionDate = props.inputResubmissionDate
      ? new Date(props.inputResubmissionDate)
      : null
    // A string after a reset (onReset hands it the prop as it came), a Date otherwise.
    const resubmissionDate = ref<Date | string | null | undefined>(localInputResubmissionDate)
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
    const creaTextAreaEl = ref<HTMLTextAreaElement | null>(null)
    const captureCreaField = (event: FocusEvent) => {
      creaTextAreaEl.value = event.target as HTMLTextAreaElement
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
      // The 💬 + alias marker is built here, locally — the moderator's name never reached
      // the AI (like [ANREDE]/[SIGNATUR]). append-only: the original text is untouched.
      //
      // The ALIAS, and NOTHING else (NU-020): this text travels via the memo into the booking
      // and stands in account statements for good, read by the member and by anyone they show
      // the statement to.
      //
      // ⛔ There used to be a firstName fallback here for a stored moderator object from
      // before the alias was in verifyLogin. It is gone: that object is only rewritten at the
      // next pass through /authenticate, and since the 10-minute token renews on every
      // request, a moderator who keeps working never passes that way -- so the "brief
      // transition window" was in truth a whole working day of permanent bookings carrying a
      // real first name. A marker without a name is cosmetic and heals itself at the next
      // sign-in; a real name in a booking memo does not.
      const moderatorName = store.moderator?.alias ?? ''
      const marker = moderatorName
        ? `${MEMO_MARKER} ${moderatorName}: ${supplement}`
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

    const { mutate: createContributionMessageMutation } = useMutation(
      adminCreateContributionMessage,
    )
    const { mutate: updateContributionMutation } = useMutation(adminUpdateContribution)

    const combineResubmissionDateAndTime = () => {
      const formattedDate = new Date(resubmissionDate.value as Date | string)
      const [hours, minutes] = resubmissionTime.value.split(':')
      formattedDate.setHours(parseInt(hours))
      formattedDate.setMinutes(parseInt(minutes))
      return formattedDate
    }

    const onSubmit = () => {
      loading.value = true
      let mutation: typeof updateContributionMutation
      let updateOnlyResubmissionAt = false
      const resubmissionAtDate = showResubmissionDate.value
        ? combineResubmissionDateAndTime()
        : null
      const variables: Record<string, unknown> = {
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

      if (showResubmissionDate.value && (resubmissionAtDate as Date) < new Date()) {
        toastError(t('contributionMessagesForm.resubmissionDateInPast'))
        loading.value = false
        return
      }

      mutation({ ...variables })
        .then(() => {
          if (
            (props.hideResubmission &&
              showResubmissionDate.value &&
              (resubmissionAtDate as Date) > new Date()) ||
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

    // The title of a tab, with what it is for in a tooltip.
    // ⚠️ `triggers` is no prop of BTooltip in bootstrap-vue-next 0.26: it lands on the element
    // as a plain attribute and changes nothing. Kept as it was.
    const tabTitle = (id: string, title: string, tooltip: string) => () => [
      <span id={id}>{title}</span>,
      <BTooltip target={id} {...{ triggers: 'hover' }}>
        {tooltip}
      </BTooltip>,
    ]

    return () => (
      <div class='contribution-messages-formular'>
        <div class='mt-5'>
          {/* BForm declares neither event: both fall through to its <form>. */}
          <BForm onReset={withModifiers(onReset, ['prevent'])} onSubmit={() => onSubmit()}>
            <BFormGroup>
              <BFormCheckbox v-model={showResubmissionDate.value}>
                {t('moderator.show-submission-form')}
              </BFormCheckbox>
            </BFormGroup>
            {showResubmissionDate.value ? (
              <BFormGroup>
                <div class='d-flex flex-wrap gap-2 my-2'>
                  <Datepicker
                    v-model={resubmissionDate.value}
                    locale={dateLocale}
                    inputFormat='P'
                    lowerLimit={now.value}
                    class='form-control'
                  />
                  <TimePicker v-model={resubmissionTime.value} />
                </div>
              </BFormGroup>
            ) : null}
            {showCreaInsert.value || showCreaAppend.value ? (
              <div class='mt-3 d-flex gap-2 align-items-center'>
                {showCreaInsert.value ? (
                  <img src={creaLogo} alt={t('crea.column')} class={classes.creaInlineLogo} />
                ) : null}
                {showCreaInsert.value ? (
                  <BButton
                    variant='outline-info'
                    size='sm'
                    data-test='crea-insert-draft'
                    onClick={insertCreaDraft}
                  >
                    {t('crea.insertDraft')}
                  </BButton>
                ) : null}
                {showCreaAppend.value ? (
                  <BButton
                    variant='outline-info'
                    size='sm'
                    data-test='crea-append-memo'
                    onClick={appendCreaSupplement}
                  >
                    {t('crea.appendToMemo')}
                  </BButton>
                ) : null}
              </div>
            ) : null}
            <BTabs
              v-model={tabindex.value}
              class='mt-3'
              contentClass='mt-3'
              data-test='message-type-tabs'
            >
              <BTab active>
                {{
                  title: tabTitle(
                    'message-tab-title',
                    t('moderator.message'),
                    t('moderator.message-tooltip'),
                  ),
                  default: () => (
                    <BFormTextarea
                      id='textarea'
                      v-model={form.value.text}
                      placeholder={t('contributionLink.memo')}
                      rows={textRows.value}
                      onKeydown={onTextKeydown}
                      onFocus={captureCreaField}
                    />
                  ),
                }}
              </BTab>
              <BTab>
                {{
                  title: tabTitle(
                    'notice-tab-title',
                    t('moderator.notice'),
                    t('moderator.notice-tooltip'),
                  ),
                  default: () => (
                    <BFormTextarea
                      id='textarea'
                      v-model={form.value.text}
                      placeholder={t('moderator.notice')}
                      rows={textRows.value}
                      onKeydown={onTextKeydown}
                      onFocus={captureCreaField}
                    />
                  ),
                }}
              </BTab>
              {/* The memo is the only part of the contribution itself a moderator edits here.
                  The amount is deliberately NOT editable -- not in this dialog and nowhere else
                  in moderation, and the same for every contribution, whether a member submitted
                  it or a moderator entered it on their behalf (confirmed 2026-08-11). A wrong
                  amount is corrected by denying or deleting the contribution and entering it
                  again, not by overwriting it. The absence of an amount field here is the
                  decision, not a gap -- do not add one without revisiting it. */}
              <BTab>
                {{
                  title: tabTitle(
                    'memo-tab-title',
                    t('moderator.memo'),
                    t('moderator.memo-tooltip'),
                  ),
                  default: () => [
                    <BFormTextarea
                      id='textarea'
                      v-model={form.value.memo}
                      placeholder={t('contributionLink.memo')}
                      rows={textRows.value}
                      onKeydown={onMemoKeydown}
                    />,
                    memoTooLong.value ? (
                      <p class='mt-1 mb-0 text-danger small'>
                        {t('crea.memoTooLong', { max: MEMO_MAX_LENGTH })}
                      </p>
                    ) : null,
                  ],
                }}
              </BTab>
            </BTabs>
            <BRow class='mt-4 mb-6'>
              <BCol>
                <BButton type='reset' variant='danger'>
                  {t('form.cancel')}
                </BButton>
              </BCol>
              <BCol class='text-end'>
                <BButton
                  type='submit'
                  variant='primary'
                  disabled={disabled.value}
                  data-test='submit-dialog'
                  onClick={withModifiers(() => onSubmit(), ['prevent'])}
                >
                  {t('save')}
                </BButton>
              </BCol>
            </BRow>
          </BForm>
        </div>
      </div>
    )
  },
})
