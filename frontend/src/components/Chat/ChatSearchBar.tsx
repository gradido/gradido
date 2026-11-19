// AI-GENERATED — not an architecture reference
import {
  computed,
  defineComponent,
  onMounted,
  type PropType,
  ref,
  withKeys,
  withModifiers,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { CHAT_SEARCH_MAX_MESSAGES } from '@/utils/chatSearch'
import IMdiChevronDown from '~icons/mdi/chevron-down'
import IMdiChevronUp from '~icons/mdi/chevron-up'
import classes from './ChatSearchBar.module.scss'

interface ChatSearchResult {
  searching: boolean
  count: number
  current: number
  busy: boolean
  capped: boolean
}

/**
 * The search bar of a conversation's window (Bernd, 30.09.2026, E-057), in the contact window and
 * in a group's window alike: the window opens it with the magnifier by its cross and hands what is
 * typed to its thread, which searches and says what it found (`result`, useChatThreadSearch).
 *
 * The keys as in a messenger: Enter goes to the older hit, Shift+Enter to the newer, Esc closes
 * the search -- and only the search: the window around it stays open.
 */
export const ChatSearchBar = defineComponent({
  name: 'ChatSearchBar',
  props: {
    /** What is typed. */
    modelValue: { type: String, default: '' },
    /** What the thread found: `{ searching, count, current, busy, capped }`. */
    result: {
      type: Object as PropType<ChatSearchResult>,
      default: () => ({ searching: false, count: 0, current: 0, busy: false, capped: false }),
    },
  },
  emits: ['update:modelValue', 'older', 'newer', 'close'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const text = computed({
      get: () => props.modelValue,
      set: (value: string) => emit('update:modelValue', value),
    })

    /** Nothing before two letters; "Suche …" while older pages come; then the hits, or none. */
    const countWords = computed(() => {
      const { searching, busy, count, current } = props.result
      if (!searching) {
        return ''
      }
      if (busy) {
        return t('chatSearch.loading')
      }
      if (!count) {
        return t('chatSearch.none')
      }
      return t('chatSearch.count', { current: current || '–', count })
    })

    const canOlder = computed(() => {
      const { busy, count, current } = props.result
      return !busy && count > 0 && current !== 1
    })
    const canNewer = computed(() => {
      const { busy, count, current } = props.result
      return !busy && current > 0 && current < count
    })

    const older = () => {
      if (canOlder.value) {
        emit('older')
      }
    }
    const newer = () => {
      if (canNewer.value) {
        emit('newer')
      }
    }
    const onEnter = (event: Event) => ((event as KeyboardEvent).shiftKey ? newer() : older())

    // The template's two key listeners on one event, each with its own key and modifiers,
    // called one after the other as Vue calls a list of listeners.
    const keyListeners: Array<(event: KeyboardEvent) => void> = [
      withKeys(withModifiers(onEnter, ['prevent']), ['enter']),
      withKeys(
        withModifiers(() => emit('close'), ['stop', 'prevent']),
        ['esc'],
      ),
    ]
    const onKeydown = (event: KeyboardEvent) => {
      for (const listener of keyListeners) {
        listener(event)
      }
    }

    // The field has the keyboard as soon as the magnifier opened it.
    const field = ref<HTMLInputElement | null>(null)
    onMounted(() => field.value?.focus({ preventScroll: true }))

    return () => (
      <div class={['chat-search', classes['chat-search']]} data-test='chat-search'>
        {/* The field, how many hits and which, and the two steps between them (E-057). ↑ goes to the
            older hit, ↓ to the newer, as the thread reads from the top down. */}
        <div class='chat-search-bar' role='search'>
          <input
            ref={field}
            v-model={text.value}
            type='text'
            class='chat-search-field'
            placeholder={t('chatSearch.placeholder')}
            aria-label={t('chatSearch.open')}
            enterKeyHint='search'
            autocomplete='off'
            data-test='chat-search-field'
            onKeydown={onKeydown}
          />
          <span class='chat-search-count' aria-live='polite' data-test='chat-search-count'>
            {countWords.value}
          </span>
          {/* ⚠️ `aria-disabled`, not `disabled`, as the thread's "older" button: a focused button
              that turns disabled loses its focus, and the keyboard would be nowhere. */}
          <button
            type='button'
            class='chat-search-step'
            aria-label={t('chatSearch.older')}
            title={t('chatSearch.older')}
            aria-disabled={canOlder.value ? 'false' : 'true'}
            data-test='chat-search-older'
            onClick={older}
          >
            <IMdiChevronUp aria-hidden='true' />
          </button>
          <button
            type='button'
            class='chat-search-step'
            aria-label={t('chatSearch.newer')}
            title={t('chatSearch.newer')}
            aria-disabled={canNewer.value ? 'false' : 'true'}
            data-test='chat-search-newer'
            onClick={newer}
          >
            <IMdiChevronDown aria-hidden='true' />
          </button>
        </div>
        {/* More pages remain than the search reads (useChatThreadSearch): said, not hidden. */}
        {props.result.capped ? (
          <p class='chat-search-capped' data-test='chat-search-capped'>
            {t('chatSearch.capped', { count: CHAT_SEARCH_MAX_MESSAGES })}
          </p>
        ) : null}
      </div>
    )
  },
})
