<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="chat-search" data-test="chat-search">
    <!-- The field, how many hits and which, and the two steps between them (E-057). ↑ goes to the
         older hit, ↓ to the newer, as the thread reads from the top down. -->
    <div class="chat-search-bar" role="search">
      <input
        ref="field"
        v-model="text"
        type="text"
        class="chat-search-field"
        :placeholder="t('chatSearch.placeholder')"
        :aria-label="t('chatSearch.open')"
        enterkeyhint="search"
        autocomplete="off"
        data-test="chat-search-field"
        @keydown.enter.prevent="onEnter"
        @keydown.esc.stop.prevent="emit('close')"
      />
      <span class="chat-search-count" aria-live="polite" data-test="chat-search-count">
        {{ countWords }}
      </span>
      <!-- ⚠️ `aria-disabled`, not `disabled`, as the thread's "older" button: a focused button
           that turns disabled loses its focus, and the keyboard would be nowhere. -->
      <button
        type="button"
        class="chat-search-step"
        :aria-label="t('chatSearch.older')"
        :title="t('chatSearch.older')"
        :aria-disabled="canOlder ? 'false' : 'true'"
        data-test="chat-search-older"
        @click="older"
      >
        <i-mdi-chevron-up aria-hidden="true" />
      </button>
      <button
        type="button"
        class="chat-search-step"
        :aria-label="t('chatSearch.newer')"
        :title="t('chatSearch.newer')"
        :aria-disabled="canNewer ? 'false' : 'true'"
        data-test="chat-search-newer"
        @click="newer"
      >
        <i-mdi-chevron-down aria-hidden="true" />
      </button>
    </div>
    <!-- More pages remain than the search reads (useChatThreadSearch): said, not hidden. -->
    <p v-if="result.capped" class="chat-search-capped" data-test="chat-search-capped">
      {{ t('chatSearch.capped', { count: CHAT_SEARCH_MAX_MESSAGES }) }}
    </p>
  </div>
</template>

<script setup>
/**
 * The search bar of a conversation's window (Bernd, 30.09.2026, E-057), in the contact window and
 * in a group's window alike: the window opens it with the magnifier by its cross and hands what is
 * typed to its thread, which searches and says what it found (`result`, useChatThreadSearch).
 *
 * The keys as in a messenger: Enter goes to the older hit, Shift+Enter to the newer, Esc closes
 * the search -- and only the search: the window around it stays open.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHAT_SEARCH_MAX_MESSAGES } from '@/utils/chatSearch'

const props = defineProps({
  /** What is typed. */
  modelValue: { type: String, default: '' },
  /** What the thread found: `{ searching, count, current, busy, capped }`. */
  result: {
    type: Object,
    default: () => ({ searching: false, count: 0, current: 0, busy: false, capped: false }),
  },
})

const emit = defineEmits(['update:modelValue', 'older', 'newer', 'close'])

const { t } = useI18n()

const text = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/** Nothing before two letters; "Suche …" while older pages come; then the hits, or none. */
const countWords = computed(() => {
  const { searching, busy, count, current } = props.result
  if (!searching) return ''
  if (busy) return t('chatSearch.loading')
  if (!count) return t('chatSearch.none')
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
  if (canOlder.value) emit('older')
}
const newer = () => {
  if (canNewer.value) emit('newer')
}
const onEnter = (event) => (event.shiftKey ? newer() : older())

// The field has the keyboard as soon as the magnifier opened it.
const field = ref(null)
onMounted(() => field.value?.focus({ preventScroll: true }))
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks, and a double slash is not a comment
   to it.

   One line: the field takes what the rest leaves. The count keeps its width while it changes,
   so the arrows do not move under the finger. */
.chat-search-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.chat-search-field {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 999px;
  background: var(--bs-body-bg, #fff);
  color: var(--bs-body-color);
  font-size: 1rem;
}

.chat-search-field:focus {
  outline: 2px solid rgba(var(--bs-link-color-rgb), 0.5);
  outline-offset: 1px;
}

.chat-search-count {
  flex: 0 0 auto;
  min-width: 4.5em;
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
  text-align: center;
  white-space: nowrap;
}

.chat-search-step {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 1.25rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chat-search-step[aria-disabled='true'] {
  opacity: 0.35;
  cursor: default;
}

.chat-search-capped {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
}
</style>
