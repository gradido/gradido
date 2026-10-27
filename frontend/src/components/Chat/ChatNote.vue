<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The member's own note on this person or group (Bernd, 27.10.2026), laid over the
       conversation and the line to write in. Only the member reads it. -->
  <section
    ref="panel"
    class="chat-note"
    tabindex="-1"
    :aria-label="$t('chatNote.title')"
    data-test="chat-note"
    @keydown.esc.stop.prevent="emit('close')"
  >
    <div class="chat-note-head">
      <span class="chat-note-title">{{ $t('chatNote.title') }}</span>
      <span class="chat-note-private">{{ $t('chatNote.private') }}</span>
    </div>
    <!-- ⛔ Not to be written while the note could not be loaded: an empty field over a note the
         server holds would replace it. -->
    <textarea
      ref="field"
      class="chat-note-field"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="$t('chatNote.title')"
      :maxlength="MESSAGE_MAX_CHARS"
      :disabled="status === 'loadFailed'"
      :aria-describedby="trouble ? troubleId : undefined"
      data-test="chat-note-field"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <div class="chat-note-foot">
      <!-- What goes wrong is said at once (role="alert"); saving and saved are only to be seen:
           announced after every pause in typing, they would talk over the member's own words. -->
      <span v-if="trouble" :id="troubleId" class="chat-note-trouble" role="alert">
        {{ trouble }}
        <button
          type="button"
          class="chat-note-retry"
          data-test="chat-note-retry"
          @click="emit('retry')"
        >
          {{ $t('chatNote.retry') }}
        </button>
      </span>
      <span v-else class="chat-note-status" data-test="chat-note-status">{{ statusWords }}</span>
      <button
        type="button"
        class="btn btn-outline-gradido btn-sm chat-note-done"
        data-test="chat-note-done"
        @click="emit('close')"
      >
        {{ $t('chatNote.done') }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { MESSAGE_MAX_CHARS } from '@/validationSchemas'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  /** '' | 'saving' | 'saved' | 'failed' | 'loadFailed' (useChatWindowNote) */
  status: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'close', 'retry'])
const { t } = useI18n()

const panel = ref(null)
const field = ref(null)
const troubleId = `chat-note-trouble-${useId()}`

const statusWords = computed(() => {
  if (props.status === 'saving') return t('chatNote.saving')
  if (props.status === 'saved') return t('chatNote.saved')
  return ''
})

const trouble = computed(() => {
  if (props.status === 'failed') return t('chatNote.failed')
  if (props.status === 'loadFailed') return t('chatNote.loadFailed')
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
</script>

<style lang="scss" scoped>
/* Over the conversation and the line to write in: the thread's own box (ChatThread's slot
   `cover`), under the rule that opens it. Opaque, in the window's colour, so nothing of the
   conversation shows through. */
.chat-note {
  position: absolute;
  inset: 0.5rem 0 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: var(--bs-modal-bg, var(--bs-body-bg));
  outline: 0;
}

.dark-mode .chat-note {
  background-color: var(--surface);
}

.chat-note-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.5rem;
}

.chat-note-title {
  font-weight: 600;
}

.chat-note-private,
.chat-note-status,
.chat-note-trouble {
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.875rem;
}

/* The field as the line to write in is drawn (ChatComposeBar's field): its rim, its words, its
   green focus -- with the corners of a page instead of a pill. */
.chat-note-field {
  flex: 1 1 auto;
  width: 100%;
  min-height: 8rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 1rem;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 1rem;
  line-height: 1.4;
  resize: none;
}

.chat-note-field::placeholder {
  color: var(--bs-secondary-color, #6c757d);
  opacity: 1;
}

.chat-note-field:focus-visible {
  border-color: var(--success, #047006);
  outline: 0;
  box-shadow: 0 0 0 1px var(--success, #047006);
}

.chat-note-field:disabled {
  opacity: 0.6;
}

.chat-note-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

/* "Try again" as a link in the line that says what went wrong. */
.chat-note-retry {
  appearance: none;
  border: 0;
  padding: 0;
  background: transparent;
  color: rgba(var(--bs-link-color-rgb), 1);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
