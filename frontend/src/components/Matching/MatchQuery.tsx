// AI-GENERATED — not an architecture reference
import {
  computed,
  defineComponent,
  nextTick,
  onUnmounted,
  type PropType,
  ref,
  watch,
  withKeys,
} from 'vue'
import { useI18n } from 'vue-i18n'
import IBiCheck from '~icons/bi/check'
import IBiChevronDown from '~icons/bi/chevron-down'
import IBiPencil from '~icons/bi/pencil'
import IBiSearch from '~icons/bi/search'
import IBiXLg from '~icons/bi/x-lg'
import { CHANNELS, displayType, LABEL_COLORS } from './displayCore'
import classes from './MatchQuery.module.scss'

type Channel = keyof typeof LABEL_COLORS

/** One of the member's own entries, as far as the question needs it. */
export type QueryEntry = { uuid: string; matchingType: string; summary: string }

/** What the map is asked for. */
export type QuerySelection =
  | { kind: 'all' }
  | { kind: 'entry'; uuid: string }
  | { kind: 'typed'; text: string; matchingType: string }

/** A word the GMS knows, with the spelling a sentence gave it where there is one. */
export type Suggestion = { word: string; entries?: number; spelling?: string | null }

/**
 * How long the field waits after the last keystroke before it asks.
 *
 * Short enough that the offers feel like part of the typing, long enough that a word
 * typed straight through costs one call instead of one per letter.
 */
const SUGGEST_DEBOUNCE_MS = 150

export const MatchQuery = defineComponent({
  name: 'MatchQuery',
  props: {
    /** The member's own entries, so one of them can be the question. */
    entries: { type: Array as PropType<QueryEntry[]>, default: () => [] },
    /** { kind: 'all' } | { kind: 'entry', uuid } | { kind: 'typed', text, matchingType } */
    selection: { type: Object as PropType<QuerySelection>, required: true },
    /**
     * What a half-typed word could become — the GMS's vocabulary, handed in rather
     * than fetched here, so this component keeps knowing nothing about the GMS.
     * `(prefix) => Promise<{word, entries}[]>`; the default offers nothing, which is
     * what a page that does not pass one means.
     */
    suggest: {
      type: Function as PropType<(prefix: string) => Promise<Suggestion[]>>,
      default: () => Promise.resolve([]),
    },
  },
  emits: ['update:selection'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const open = ref(false)
    const typing = ref(false)
    const text = ref('')
    const chosen = ref<string | null>(null)
    const textInput = ref<HTMLInputElement | null>(null)
    const suggestions = ref<Suggestion[]>([])
    // The keystroke the offers on screen belong to. Two calls can be in flight when
    // somebody types on while the first is still out, and the older answer must not
    // land on top of the newer one - the same rule the search itself keeps.
    let asked = 0
    let debounce: ReturnType<typeof setTimeout> | null = null

    // A blank field has nothing to ask about, so the stances stay inert until there is
    // something to complete.
    const canAsk = computed(() => text.value.trim().length > 1)

    const currentLabel = computed(() => {
      const selection = props.selection
      if (selection.kind === 'typed') {
        return selection.text
      }
      if (selection.kind === 'entry') {
        const entry = props.entries.find((e) => e.uuid === selection.uuid)
        if (entry) {
          return `${t(`matching.type.${displayType(entry.matchingType)}.prefix`)} ${entry.summary}`
        }
      }
      return t('matching.query.all')
    })

    function dotColor(matchingType: string) {
      return LABEL_COLORS[displayType(matchingType) as Channel]
    }

    function chooseAll() {
      open.value = false
      emit('update:selection', { kind: 'all' })
    }

    function chooseEntry(entry: QueryEntry) {
      open.value = false
      emit('update:selection', { kind: 'entry', uuid: entry.uuid })
    }

    async function startTyping() {
      open.value = false
      typing.value = true
      text.value = props.selection.kind === 'typed' ? props.selection.text : ''
      chosen.value = props.selection.kind === 'typed' ? props.selection.matchingType : null
      await nextTick()
      textInput.value?.focus()
    }

    function cancelTyping() {
      typing.value = false
      text.value = ''
      chosen.value = null
      clearSuggestions()
      emit('update:selection', { kind: 'all' })
    }

    /**
     * Stop offering, and make sure no answer already on its way arrives to undo it.
     *
     * Raising the counter is the whole of it: every call in flight compares against it
     * before it writes, so one that comes back after this finds itself out of date.
     */
    function clearSuggestions() {
      asked++
      if (debounce) {
        clearTimeout(debounce)
      }
      debounce = null
      suggestions.value = []
    }

    /**
     * How an offer reads: the spelling a sentence gave up, or the folded word itself.
     *
     * Null is the ordinary case for a word no sentence ever contained - a keying model
     * coins those - and the folded word is then exactly what was shown before the GMS
     * had a spelling at all.
     */
    function readable(word: Suggestion) {
      return word.spelling ?? word.word
    }

    /** Esc takes back the smallest thing that is open: the offers first, the field after. */
    function onEsc() {
      if (suggestions.value.length) {
        clearSuggestions()
        return
      }
      cancelTyping()
    }

    /**
     * Put the word in the field and leave the cursor there — the stances still ask.
     *
     * Nothing is done about the stance, and nothing needs to be: pressing one puts the
     * offers away (`ask`), and typing takes it back (`onText`), so an offer can only ever
     * be pressed while no stance is chosen. Measured, not assumed - a line clearing it
     * here could be deleted with the whole suite still green.
     */
    function chooseSuggestion(word: string) {
      text.value = word
      clearSuggestions()
      textInput.value?.focus()
    }

    /**
     * Changing the words takes the stance back.
     *
     * Otherwise the list below would still hold answers to a sentence that no longer
     * exists. Letting the choice fall means one rule holds throughout: what you see
     * belongs to the sentence you finished.
     */
    function onText() {
      chosen.value = null
      if (debounce) {
        clearTimeout(debounce)
      }
      const typed = text.value
      debounce = setTimeout(async () => {
        const mine = ++asked
        const words = await props.suggest(typed)
        // Only the newest question may write. An older answer landing late would put
        // the offers for `ras` under a field that already says `rasenlue`.
        if (mine === asked) {
          suggestions.value = words
        }
      }, SUGGEST_DEBOUNCE_MS)
    }

    // A timer that outlives the component would call into a torn-down instance, and the
    // member has left the search by then anyway.
    onUnmounted(() => {
      if (debounce) {
        clearTimeout(debounce)
      }
    })

    function ask(channel: string) {
      if (!canAsk.value) {
        return
      }
      chosen.value = channel
      // The sentence is finished; what could still have completed it is no longer an offer.
      clearSuggestions()
      emit('update:selection', {
        kind: 'typed',
        text: text.value.trim(),
        matchingType: channel,
      })
    }

    // Someone else may reset the search - leaving the page, or picking an entry from
    // somewhere. Fold the typing away when that happens, rather than leaving a field
    // standing that no longer describes what is shown.
    watch(
      () => props.selection,
      (next) => {
        if (next.kind !== 'typed' && typing.value && !text.value) {
          typing.value = false
        }
      },
    )

    const onInput = (event: Event) => {
      text.value = (event.target as HTMLInputElement).value
      onText()
    }

    const isCurrentEntry = (entry: QueryEntry) =>
      props.selection.kind === 'entry' && props.selection.uuid === entry.uuid

    return () => (
      <div
        class={[
          'match-query',
          classes['match-query'],
          { 'is-typing': typing.value, 'can-ask': canAsk.value },
        ]}
      >
        {/* Closed: what is being searched for right now, and a way to change it. */}
        {!typing.value ? (
          <button
            type='button'
            class='query-bar'
            aria-expanded={String(open.value) as 'true' | 'false'}
            aria-label={t('matching.query.open')}
            onClick={() => {
              open.value = !open.value
            }}
          >
            {/* No "I am looking for" in front of it. The value says what it is on its
                own, and the sentence only made the bar longer. */}
            <IBiSearch class='query-icon' />
            <span class='query-value'>{currentLabel.value}</span>
            <IBiChevronDown class='query-caret' />
          </button>
        ) : null}

        {/* Open: everything that can be searched for — all of my entries, one of
            them, or something typed. One question, one list of answers. */}
        {open.value && !typing.value ? (
          <ul class='query-menu' role='listbox'>
            <li
              class={['query-option', { 'is-current': props.selection.kind === 'all' }]}
              role='option'
              aria-selected={String(props.selection.kind === 'all') as 'true' | 'false'}
              onClick={chooseAll}
            >
              {props.selection.kind === 'all' ? <IBiCheck class='option-check' /> : null}
              <span class='option-text'>{t('matching.query.all')}</span>
            </li>

            {props.entries.map((entry) => (
              <li
                key={entry.uuid}
                class={['query-option', { 'is-current': isCurrentEntry(entry) }]}
                role='option'
                aria-selected={String(isCurrentEntry(entry)) as 'true' | 'false'}
                onClick={() => chooseEntry(entry)}
              >
                <span class='option-dot' style={{ background: dotColor(entry.matchingType) }} />
                <span class='option-text'>
                  {`${t(`matching.type.${displayType(entry.matchingType)}.prefix`)} ${entry.summary}`}
                </span>
              </li>
            ))}

            <li
              class='query-option is-other'
              role='option'
              aria-selected='false'
              onClick={startTyping}
            >
              <IBiPencil class='option-check' />
              <span class='option-text'>{t('matching.query.other')}</span>
            </li>
          </ul>
        ) : null}

        {/* Typing: the field alone is not a question. The three stances below finish
            the sentence, and finishing it is what asks. */}
        {typing.value ? (
          <div class='query-typed'>
            <div class='typed-row'>
              <IBiSearch class='query-icon' />
              {/* 160, the same as an entry's summary column - taking the keep-offer
                  hands this very text over as the summary, and maxlength does not reach
                  a value the code fills in. Capping it here is the only place that
                  holds for both roads. A one-line search wants no more anyway. */}
              <input
                ref={textInput}
                v-model={text.value}
                type='text'
                class='typed-input'
                maxlength='160'
                placeholder={t('matching.query.placeholder')}
                aria-label={t('matching.query.label')}
                onInput={onInput}
                onKeydown={withKeys(onEsc, ['esc'])}
              />
              <button
                type='button'
                class='typed-clear'
                aria-label={t('matching.query.clear')}
                onClick={cancelTyping}
              >
                <IBiXLg />
              </button>
            </div>

            {/* The words that could finish what is being typed. Not a correction and not
                a filter: they are the words entries are actually found under, so picking
                one is picking a search that has something to find. Nothing is asked until
                the second letter, and the stances below still do the asking. */}
            {/* A plain list of buttons, not a listbox: nothing here is selected and the
                arrow keys do not walk it. Pressing one fills the field, and the stances
                still ask. */}
            {suggestions.value.length ? (
              <ul class='typed-suggestions' aria-label={t('matching.query.suggestions')}>
                {suggestions.value.map((word) => (
                  <li key={word.word}>
                    {/* Shown and inserted as it reads, not as it is stored. The GMS keeps
                        one folded form per word so that two members can share it
                        (`rasenluefter`) and, where a member's own sentence spelled it out,
                        the readable one beside it. Searching is unaffected either way: the
                        typed search folds what it is given, so `Rasenlüfter` and
                        `rasenluefter` are one question. */}
                    <button
                      type='button'
                      class='suggestion'
                      onClick={() => chooseSuggestion(readable(word))}
                    >
                      {readable(word)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div class='typed-stances' role='group' aria-label={t('matching.query.pick')}>
              {CHANNELS.map((channel) => (
                <button
                  key={channel}
                  type='button'
                  class={['stance', { 'is-chosen': chosen.value === channel }]}
                  disabled={!canAsk.value}
                  aria-pressed={String(chosen.value === channel) as 'true' | 'false'}
                  onClick={() => ask(channel)}
                >
                  {t(`matching.type.${channel}.prefix`)}
                </button>
              ))}
            </div>

            <p class='typed-hint'>
              {chosen.value ? t('matching.query.untouched') : t('matching.query.pick')}
            </p>
          </div>
        ) : null}
      </div>
    )
  },
})
