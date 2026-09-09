<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="match-query" :class="{ 'is-typing': typing, 'can-ask': canAsk }">
    <!-- Closed: what is being searched for right now, and a way to change it. -->
    <button
      v-if="!typing"
      type="button"
      class="query-bar"
      :aria-expanded="String(open)"
      :aria-label="$t('matching.query.open')"
      @click="open = !open"
    >
      <!-- No "I am looking for" in front of it. The value says what it is on its
           own, and the sentence only made the bar longer. -->
      <i-bi-search class="query-icon" />
      <span class="query-value">{{ currentLabel }}</span>
      <i-bi-chevron-down class="query-caret" />
    </button>

    <!-- Open: everything that can be searched for — all of my entries, one of
         them, or something typed. One question, one list of answers. -->
    <ul v-if="open && !typing" class="query-menu" role="listbox">
      <li
        class="query-option"
        :class="{ 'is-current': selection.kind === 'all' }"
        role="option"
        :aria-selected="String(selection.kind === 'all')"
        @click="chooseAll"
      >
        <i-bi-check v-if="selection.kind === 'all'" class="option-check" />
        <span class="option-text">{{ $t('matching.query.all') }}</span>
      </li>

      <li
        v-for="entry in entries"
        :key="entry.uuid"
        class="query-option"
        :class="{ 'is-current': selection.kind === 'entry' && selection.uuid === entry.uuid }"
        role="option"
        :aria-selected="String(selection.kind === 'entry' && selection.uuid === entry.uuid)"
        @click="chooseEntry(entry)"
      >
        <span class="option-dot" :style="{ background: dotColor(entry.matchingType) }" />
        <span class="option-text">
          {{ $t(`matching.type.${displayType(entry.matchingType)}.prefix`) }} {{ entry.summary }}
        </span>
      </li>

      <li class="query-option is-other" role="option" aria-selected="false" @click="startTyping">
        <i-bi-pencil class="option-check" />
        <span class="option-text">{{ $t('matching.query.other') }}</span>
      </li>
    </ul>

    <!-- Typing: the field alone is not a question. The three stances below finish
         the sentence, and finishing it is what asks. -->
    <div v-if="typing" class="query-typed">
      <div class="typed-row">
        <i-bi-search class="query-icon" />
        <!-- 160, the same as an entry's summary column - taking the keep-offer
             hands this very text over as the summary, and maxlength does not reach
             a value the code fills in. Capping it here is the only place that
             holds for both roads. A one-line search wants no more anyway. -->
        <input
          ref="textInput"
          v-model="text"
          type="text"
          class="typed-input"
          maxlength="160"
          :placeholder="$t('matching.query.placeholder')"
          :aria-label="$t('matching.query.label')"
          @input="onText"
          @keydown.esc="onEsc"
        />
        <button
          type="button"
          class="typed-clear"
          :aria-label="$t('matching.query.clear')"
          @click="cancelTyping"
        >
          <i-bi-x-lg />
        </button>
      </div>

      <!-- The words that could finish what is being typed. Not a correction and not
           a filter: they are the words entries are actually found under, so picking
           one is picking a search that has something to find. Nothing is asked until
           the second letter, and the stances below still do the asking. -->
      <!-- A plain list of buttons, not a listbox: nothing here is selected and the
           arrow keys do not walk it. Pressing one fills the field, and the stances
           still ask. -->
      <ul
        v-if="suggestions.length"
        class="typed-suggestions"
        :aria-label="$t('matching.query.suggestions')"
      >
        <li v-for="word in suggestions" :key="word.word">
          <button type="button" class="suggestion" @click="chooseSuggestion(word.word)">
            {{ word.word }}
          </button>
        </li>
      </ul>

      <div class="typed-stances" role="group" :aria-label="$t('matching.query.pick')">
        <button
          v-for="channel in CHANNELS"
          :key="channel"
          type="button"
          class="stance"
          :class="{ 'is-chosen': chosen === channel }"
          :disabled="!canAsk"
          :aria-pressed="String(chosen === channel)"
          @click="ask(channel)"
        >
          {{ $t(`matching.type.${channel}.prefix`) }}
        </button>
      </div>

      <p class="typed-hint">
        {{ chosen ? $t('matching.query.untouched') : $t('matching.query.pick') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHANNELS, LABEL_COLORS, displayType } from './displayCore'

const props = defineProps({
  /** The member's own entries, so one of them can be the question. */
  entries: { type: Array, default: () => [] },
  /** { kind: 'all' } | { kind: 'entry', uuid } | { kind: 'typed', text, matchingType } */
  selection: { type: Object, required: true },
  /**
   * What a half-typed word could become — the GMS's vocabulary, handed in rather
   * than fetched here, so this component keeps knowing nothing about the GMS.
   * `(prefix) => Promise<{word, entries}[]>`; the default offers nothing, which is
   * what a page that does not pass one means.
   */
  suggest: { type: Function, default: () => Promise.resolve([]) },
})

/**
 * How long the field waits after the last keystroke before it asks.
 *
 * Short enough that the offers feel like part of the typing, long enough that a word
 * typed straight through costs one call instead of one per letter.
 */
const SUGGEST_DEBOUNCE_MS = 150

const emit = defineEmits(['update:selection'])

const { t } = useI18n()

const open = ref(false)
const typing = ref(false)
const text = ref('')
const chosen = ref(null)
const textInput = ref(null)
const suggestions = ref([])
// The keystroke the offers on screen belong to. Two calls can be in flight when
// somebody types on while the first is still out, and the older answer must not
// land on top of the newer one - the same rule the search itself keeps.
let asked = 0
let debounce = null

// A blank field has nothing to ask about, so the stances stay inert until there is
// something to complete.
const canAsk = computed(() => text.value.trim().length > 1)

const currentLabel = computed(() => {
  if (props.selection.kind === 'typed') return props.selection.text
  if (props.selection.kind === 'entry') {
    const entry = props.entries.find((e) => e.uuid === props.selection.uuid)
    if (entry)
      return `${t(`matching.type.${displayType(entry.matchingType)}.prefix`)} ${entry.summary}`
  }
  return t('matching.query.all')
})

function dotColor(matchingType) {
  return LABEL_COLORS[displayType(matchingType)]
}

function chooseAll() {
  open.value = false
  emit('update:selection', { kind: 'all' })
}

function chooseEntry(entry) {
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
  clearTimeout(debounce)
  debounce = null
  suggestions.value = []
}

/** Esc takes back the smallest thing that is open: the offers first, the field after. */
function onEsc() {
  if (suggestions.value.length) {
    clearSuggestions()
    return
  }
  cancelTyping()
}

/** Put the word in the field and leave the cursor there — the stances still ask. */
function chooseSuggestion(word) {
  text.value = word
  // Same rule as typing: the words changed, so the stance falls with them.
  chosen.value = null
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
  clearTimeout(debounce)
  const typed = text.value
  debounce = setTimeout(async () => {
    const mine = ++asked
    const words = await props.suggest(typed)
    // Only the newest question may write. An older answer landing late would put
    // the offers for `ras` under a field that already says `rasenlue`.
    if (mine === asked) suggestions.value = words
  }, SUGGEST_DEBOUNCE_MS)
}

// A timer that outlives the component would call into a torn-down instance, and the
// member has left the search by then anyway.
onUnmounted(() => clearTimeout(debounce))

function ask(channel) {
  if (!canAsk.value) return
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
    if (next.kind !== 'typed' && typing.value && !text.value) typing.value = false
  },
)
</script>

<style scoped>
.match-query {
  position: relative;
  margin-bottom: 0.75rem;
}

.query-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-subtle, rgb(0 0 0 / 15%));
  border-radius: 0.5rem;
  background: var(--surface);
  color: var(--text);
  text-align: left;
}

.query-icon {
  flex: none;
  opacity: 0.65;
}

.query-value {
  flex: 1;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.query-caret {
  flex: none;
  opacity: 0.5;
}

.query-menu {
  position: absolute;
  z-index: 1200;
  right: 0;
  left: 0;
  margin: 0.25rem 0 0;
  padding: 0;
  border: 1px solid var(--border-subtle, rgb(0 0 0 / 15%));
  border-radius: 0.5rem;
  background: var(--surface);
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 15%);
  list-style: none;
}

.query-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--surface-muted);
  cursor: pointer;
}

.query-option:first-child {
  border-top: 0;
}

.query-option:hover,
.query-option.is-current {
  background: var(--surface-muted);
}

.query-option.is-other {
  font-weight: 600;
}

.option-check {
  flex: none;
  opacity: 0.7;
}

.option-dot {
  flex: none;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
}

.option-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.typed-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border-subtle, rgb(0 0 0 / 15%));
  border-radius: 0.5rem;
  background: var(--surface);
}

.typed-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
}

.typed-input:focus {
  outline: none;
}

.typed-clear {
  flex: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
}

/* The offers sit between the field and the stances, in reading order: what could
   finish the sentence, then what the sentence means. Chips rather than a dropdown -
   they push the stances down instead of covering them, so nothing the member is
   about to press moves out from under their finger. */
.typed-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}

/* Deliberately not the gold of the stances. Gold is MY word on this page - the home
   marker, the chosen stance - and a suggestion is the vocabulary's word, not mine. */
.suggestion {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border-subtle, rgb(0 0 0 / 15%));
  border-radius: 1rem;
  background: var(--surface);
  color: var(--text);
  font-size: 0.8125rem;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease;
}

.suggestion:hover {
  border-color: var(--text-muted);
  background: var(--surface-muted);
}

/* Room for the chosen one's ring to stand free of its neighbours. */
.typed-stances {
  display: flex;
  gap: 0.625rem;
  margin-top: 0.5rem;
}

/* Not a channel colour. On the map red/green/blue already mean "what the other
   person said"; the stance is MY word, and the house already has a colour for that
   — the gold of the home marker.

   The weight of the outline carries the state, and it runs the right way round: the
   ones still on offer wear a hairline, the one actually chosen wears the thick ring.
   The first try had it backwards — a fat ring on the two open choices and none at
   all on the chosen one, which made the answer look like the leftover.

   The thick ring is a shadow, not a border, so the three chips never shift as the
   choice moves between them. */
.stance {
  padding: 0.3rem 0.85rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  background: var(--surface-muted);
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

/* Nothing to complete yet: no outline at all, and the words step back. */
.stance:disabled {
  border-color: transparent;
  color: var(--text-muted);
  font-weight: 400;
  opacity: 0.55;
  cursor: default;
}

/* On offer: a hairline. Enough to say "pressable", not enough to compete with the
   one that was pressed. */
.stance:not(:disabled) {
  border-color: color-mix(in srgb, #c69130 70%, transparent);
  background: var(--surface);
}

.stance.is-chosen {
  border-color: transparent;
  background: var(--text);
  color: var(--surface);
  box-shadow: 0 0 0 3px #c69130;
}

.stance:not(:disabled, .is-chosen):hover {
  background: color-mix(in srgb, #c69130 12%, var(--surface));
}

.typed-hint {
  margin: 0.375rem 0 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
  transition: opacity 0.18s ease;
}

/* The hint dims with the buttons, so "not yet" and "your turn" are one signal
   instead of two half-signals. */
.match-query:not(.can-ask) .typed-hint {
  opacity: 0.55;
}
</style>
