// AI-GENERATED — not an architecture reference
import { BButton, BListGroupItem } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, type PropType, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserRemarkState } from '@/composables/useUserRemark'
import IMdiNoteText from '~icons/mdi/note-text'
import IMdiNoteTextOutline from '~icons/mdi/note-text-outline'
import classes from './MemberRemark.module.css'
import walletLinkClasses from './MemberWalletLink.module.css'

/**
 * The moderation's remark on a member (Bernd, 28.10.2026): "Bemerkung", to keep it apart from the
 * tab "Notiz" of an open contribution, which is a note on that one contribution. Three parts, each
 * at its place in the card of an opened contribution (ContributionMessagesList); the state is the
 * card's (composables/useUserRemark).
 *
 * The length the field lets through is the server's number (shared/src/const/frontendReadable.ts),
 * and userRemark.drift.spec.ts holds the two together. They count differently: `maxlength` in
 * UTF-16 code units (an emoji is two), the server's check as validator.js does (an emoji is one).
 * The field is the stricter of the two, so whatever it lets through, the server takes.
 */
export const USER_REMARK_MAX_CHARS = 2000

/**
 * The button behind the pin and the arrow or the bubble: the wallet's sign of a note, filled where
 * there is a remark. It opens the field and closes it again. Drawn at once, in the size of the
 * buttons beside it (MemberWalletLink.module.css), and not to be pressed until the remark is read:
 * what comes with the answer moves nothing in the line.
 */
export const MemberRemarkToggle = defineComponent({
  name: 'MemberRemarkToggle',
  props: {
    state: { type: Object as PropType<UserRemarkState>, required: true },
    // How the card speaks of the member, for the button's name.
    name: { type: String, default: '' },
    // The id of the field it opens.
    controls: { type: String, default: undefined },
  },
  setup(props) {
    const { t } = useI18n()
    const label = computed(() => t('remark.title', { name: props.name }))
    return () => (
      <button
        type='button'
        class={walletLinkClasses.memberWalletLink}
        // The 2 px the button before it gives back, taken again, as the arrow takes them behind
        // the pin (MemberWalletLink.module.css): edge to edge, and the rings of the keyboard do
        // not overlap. A style of its own: a class would tie with the one beside it.
        style={{ marginLeft: '0.125rem' }}
        data-test='member-remark-toggle'
        title={label.value}
        aria-label={label.value}
        aria-expanded={props.state.open.value ? 'true' : 'false'}
        aria-controls={props.state.open.value ? props.controls : undefined}
        disabled={!props.state.loaded.value}
        onClick={() => props.state.toggle()}
      >
        {props.state.saved.value ? (
          <IMdiNoteText aria-hidden='true' />
        ) : (
          <IMdiNoteTextOutline aria-hidden='true' />
        )}
      </button>
    )
  },
})

/**
 * The remark under the member line while the field is closed: its words, line breaks kept. Only
 * where there is one.
 */
export const MemberRemarkLine = defineComponent({
  name: 'MemberRemarkLine',
  props: {
    state: { type: Object as PropType<UserRemarkState>, required: true },
  },
  setup(props) {
    const { t } = useI18n()
    return () =>
      props.state.saved.value ? (
        <BListGroupItem class={classes.remarkLine} data-test='member-remark'>
          <IMdiNoteText aria-hidden='true' />
          <span class={classes.remarkText}>
            <span class='visually-hidden'>{`${t('remark.label')}: `}</span>
            {props.state.saved.value.remark}
          </span>
        </BListGroupItem>
      ) : null
  },
})

/**
 * The field, in the place of the remark: the words, who sees them, who wrote them last and when,
 * and whether they are saved. It takes the keyboard when it opens -- the moderator pressed the
 * button to write --, and "Fertig" or Escape close it.
 */
export const MemberRemarkEditor = defineComponent({
  name: 'MemberRemarkEditor',
  props: {
    state: { type: Object as PropType<UserRemarkState>, required: true },
    name: { type: String, default: '' },
    fieldId: { type: String, required: true },
  },
  emits: ['done'],
  setup(props, { emit }) {
    const { t, d } = useI18n()
    const field = ref<HTMLTextAreaElement | null>(null)
    const privateId = useId()
    const troubleId = useId()

    onMounted(() => {
      const element = field.value
      if (element) {
        element.focus()
        // At the end of the words, to go on writing.
        element.setSelectionRange(element.value.length, element.value.length)
      }
    })

    const lastChanged = computed(() => {
      const saved = props.state.saved.value
      if (!saved) {
        return null
      }
      const date = d(new Date(saved.updatedAt), 'shortTime')
      return saved.updatedByName
        ? t('remark.lastChanged', { name: saved.updatedByName, date })
        : t('remark.lastChangedNoName', { date })
    })

    const failed = computed(() => props.state.status.value === 'failed')
    const statusWords = computed(() => {
      switch (props.state.status.value) {
        case 'saving':
          return t('remark.saving')
        case 'saved':
          return t('remark.saved')
        default:
          return ''
      }
    })

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        emit('done')
      }
    }

    return () => (
      // Escape anywhere in the field's part -- the words, "Noch einmal", "Fertig" -- closes it.
      <BListGroupItem
        class={classes.remarkEditor}
        data-test='member-remark-editor'
        onKeydown={onKeydown}
      >
        <label for={props.fieldId} class='form-label fw-semibold mb-0'>
          {t('remark.title', { name: props.name })}
        </label>
        <textarea
          ref={field}
          id={props.fieldId}
          class={['form-control', classes.remarkField]}
          rows={3}
          maxlength={USER_REMARK_MAX_CHARS}
          value={props.state.draft.value}
          aria-describedby={failed.value ? `${privateId} ${troubleId}` : privateId}
          data-test='member-remark-field'
          onInput={(event: Event) => props.state.input((event.target as HTMLTextAreaElement).value)}
        />
        <div id={privateId} class='form-text mt-0'>
          {t('remark.private', { name: props.name })}
        </div>
        <div class={['small', classes.remarkFoot]}>
          {lastChanged.value ? (
            <span class='text-body-secondary' data-test='member-remark-last-changed'>
              {lastChanged.value}
            </span>
          ) : null}
          {/* What goes wrong is said at once (role="alert"); saving and saved are only to be
              seen: announced after every pause in typing, they would talk over the words. */}
          {failed.value ? (
            <span id={troubleId} class={classes.remarkStatus} role='alert'>
              {`${t('remark.failed')} `}
              <button
                type='button'
                class={classes.remarkRetry}
                data-test='member-remark-retry'
                onClick={() => props.state.retry()}
              >
                {t('remark.retry')}
              </button>
            </span>
          ) : (
            <span
              class={['text-body-secondary', classes.remarkStatus]}
              data-test='member-remark-status'
            >
              {statusWords.value}
            </span>
          )}
          <BButton
            size='sm'
            variant='outline-primary'
            data-test='member-remark-done'
            onClick={() => emit('done')}
          >
            {t('remark.done')}
          </BButton>
        </div>
      </BListGroupItem>
    )
  },
})
