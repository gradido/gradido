// AI-GENERATED — not an architecture reference
import { computed, defineComponent, onMounted, ref, useId, withKeys, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { MESSAGE_MAX_CHARS } from '@/validationSchemas'
import classes from './ChatNote.module.scss'

export const ChatNote = defineComponent({
  name: 'ChatNote',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    /** '' | 'loading' | 'loadFailed' | 'saving' | 'saved' | 'failed' (useChatWindowNote) */
    status: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'close', 'retry'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const panel = ref<HTMLElement | null>(null)
    const field = ref<HTMLTextAreaElement | null>(null)
    const troubleId = `chat-note-trouble-${useId()}`

    const statusWords = computed(() => {
      if (props.status === 'saving') {
        return t('chatNote.saving')
      }
      if (props.status === 'saved') {
        return t('chatNote.saved')
      }
      return ''
    })

    const trouble = computed(() => {
      if (props.status === 'failed') {
        return t('chatNote.failed')
      }
      if (props.status === 'loadFailed') {
        return t('chatNote.loadFailed')
      }
      return ''
    })

    // An empty note is opened to be written: the field takes the keyboard. A note with words is
    // opened to be read -- on a phone a keyboard would cover it --, so the panel takes the focus,
    // and the field is the next stop of the Tab key. So does a note that could not be loaded.
    onMounted(() => {
      if (props.modelValue.trim() || props.status === 'loadFailed') {
        panel.value?.focus()
      } else {
        field.value?.focus()
      }
    })

    return () => (
      // The member's own note on this person or group (Bernd, 27.10.2026), laid over the
      // conversation and the line to write in. Only the member reads it.
      <section
        ref={panel}
        class={['chat-note', classes['chat-note']]}
        tabindex={-1}
        aria-label={t('chatNote.title')}
        data-test='chat-note'
        onKeydown={withKeys(
          withModifiers(() => emit('close'), ['stop', 'prevent']),
          ['esc'],
        )}
      >
        <div class='chat-note-head'>
          <span class='chat-note-title'>{t('chatNote.title')}</span>
          <span class='chat-note-private'>{t('chatNote.private')}</span>
        </div>
        {/* ⛔ Not to be written while the note is not loaded -- while it loads, and where loading
            failed: an empty field over a note the server holds would replace it. */}
        <textarea
          ref={field}
          class='chat-note-field'
          value={props.modelValue}
          placeholder={props.placeholder}
          aria-label={t('chatNote.title')}
          maxlength={MESSAGE_MAX_CHARS}
          disabled={props.status === 'loadFailed' || props.status === 'loading'}
          aria-describedby={trouble.value ? troubleId : undefined}
          data-test='chat-note-field'
          onInput={(event) =>
            emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
          }
        />
        <div class='chat-note-foot'>
          {/* What goes wrong is said at once (role="alert"); saving and saved are only to be seen:
              announced after every pause in typing, they would talk over the member's own words. */}
          {trouble.value ? (
            <span id={troubleId} class='chat-note-trouble' role='alert'>
              {trouble.value}{' '}
              <button
                type='button'
                class='chat-note-retry'
                data-test='chat-note-retry'
                onClick={() => emit('retry')}
              >
                {t('chatNote.retry')}
              </button>
            </span>
          ) : (
            <span class='chat-note-status' data-test='chat-note-status'>
              {statusWords.value}
            </span>
          )}
          <button
            type='button'
            class='btn btn-outline-gradido btn-sm chat-note-done'
            data-test='chat-note-done'
            onClick={() => emit('close')}
          >
            {t('chatNote.done')}
          </button>
        </div>
      </section>
    )
  },
})
