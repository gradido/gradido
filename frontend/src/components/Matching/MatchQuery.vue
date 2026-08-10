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
          @keydown.esc="cancelTyping"
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

      <!-- A second line for the particulars. The reranker reads the stem, the summary
           AND the details, and the details are what lift a hit from "same word" to
           "same thing" — the seed runs measured it. One line, not a box: in a search
           nobody writes an essay, and a tall field would invite one. Optional; the
           summary alone still asks a whole question. -->
      <div class="typed-row typed-details">
        <!-- The same 500 the search route allows (matchQuerySchema in the GMS
             backend). Stopping a long paste at the field is kinder than letting the
             server refuse it after the question was already asked. -->
        <input
          v-model="details"
          type="text"
          class="typed-input"
          maxlength="500"
          :placeholder="$t('matching.query.detailsPlaceholder')"
          :aria-label="$t('matching.query.details')"
          @input="onText"
          @keydown.esc="cancelTyping"
        />
      </div>

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
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHANNELS, LABEL_COLORS, displayType } from './displayCore'

const props = defineProps({
  /** The member's own entries, so one of them can be the question. */
  entries: { type: Array, default: () => [] },
  /** { kind: 'all' } | { kind: 'entry', uuid } | { kind: 'typed', text, matchingType } */
  selection: { type: Object, required: true },
})

const emit = defineEmits(['update:selection'])

const { t } = useI18n()

const open = ref(false)
const typing = ref(false)
const text = ref('')
const details = ref('')
const chosen = ref(null)
const textInput = ref(null)

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
  details.value = props.selection.kind === 'typed' ? (props.selection.details ?? '') : ''
  chosen.value = props.selection.kind === 'typed' ? props.selection.matchingType : null
  await nextTick()
  textInput.value?.focus()
}

function cancelTyping() {
  typing.value = false
  text.value = ''
  details.value = ''
  chosen.value = null
  emit('update:selection', { kind: 'all' })
}

/**
 * Changing the words takes the stance back — the details count as words too.
 *
 * Otherwise the list below would still hold answers to a sentence that no longer
 * exists. Letting the choice fall means one rule holds throughout: what you see
 * belongs to the sentence you finished. The details narrow the very same question,
 * so editing them has to take the stance back exactly as the summary does.
 */
function onText() {
  chosen.value = null
}

function ask(channel) {
  if (!canAsk.value) return
  chosen.value = channel
  emit('update:selection', {
    kind: 'typed',
    text: text.value.trim(),
    details: details.value.trim(),
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

/* Subordinate to the line above it: same field, quieter. It carries no icon and no
   clear cross, because it is not a second search — it is the rest of the first. */
.typed-details {
  margin-top: 0.375rem;
  padding-left: 2.15rem;
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
