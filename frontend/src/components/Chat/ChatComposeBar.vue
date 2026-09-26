<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div ref="root" class="chat-compose" data-test="chat-compose">
    <!-- The first message of a pair always goes out as a mail too -- the server decides that,
         whatever is asked (E-024) -- so there is nothing to choose, and a sentence says so
         where the box would stand. -->
    <p v-if="first" :id="firstId" class="chat-compose-first" data-test="chat-compose-first">
      <i-mdi-email-outline class="chat-compose-first-icon" aria-hidden="true" />
      <span>{{ t('chatThread.firstGoesByEmail', { name }) }}</span>
    </p>

    <div class="chat-compose-row">
      <label :for="fieldId" class="visually-hidden">{{ placeholder }}</label>
      <!-- ⛔ Enter makes a new line, as in every text field; it never sends. Many in the
           community did not grow up with chat programs, and a message that leaves half-written
           cannot be called back. The button sends -- at the desk also Cmd/Ctrl+Enter. -->
      <textarea
        :id="fieldId"
        ref="field"
        v-model="text"
        class="chat-compose-field"
        rows="1"
        :maxlength="MESSAGE_MAX_CHARS"
        :placeholder="placeholder"
        :aria-describedby="describedBy"
        data-test="chat-compose-field"
        @input="grow"
        @keydown.enter="sendOnModifiedEnter"
      />
      <!-- `aria-disabled`, not `disabled`: a focused button that is disabled loses its focus in
           Chrome, and a keyboard that sent with it would be nowhere while the message is on its
           way. The handler turns a press away instead.

           `@mousedown.prevent` keeps the focus in the field when the button is clicked or
           tapped -- the keyboard of a phone stays open for the next message. The click itself
           is not prevented. -->
      <button
        type="button"
        class="chat-compose-send"
        :aria-label="t('chatThread.send')"
        :title="t('chatThread.send')"
        :aria-disabled="canSend ? 'false' : 'true'"
        data-test="chat-compose-send"
        @mousedown.prevent
        @click="submit"
      >
        <i-mdi-send class="chat-compose-send-icon" aria-hidden="true" />
      </button>
    </div>

    <!-- The sender's wish for THIS message (E-024): empty by default, and empty again after
         every message sent -- a mail is the exception somebody asks for, not a setting. A real
         checkbox with its word beside it (E-029: a symbol without a word is not read by many). -->
    <div v-if="!first" class="chat-compose-options">
      <!-- The box and its word as ONE thing, the box inside its label: a long word (in
           Russian the whole sentence) wraps beside the box instead of the row putting the
           word on a line of its own under an empty-looking box. -->
      <label class="chat-compose-check" data-test="chat-compose-email-label">
        <input
          v-model="alsoByEmail"
          type="checkbox"
          class="chat-compose-check-box"
          data-test="chat-compose-email"
        />
        <span class="chat-compose-check-text">
          {{ alsoByEmail ? t('chatThread.alsoByEmailTo', { name }) : t('chatThread.alsoByEmail') }}
        </span>
      </label>
      <!-- No sentence beside it on what an empty box means: the desk has the phone's label and
           nothing else (Bernd, 24.09.2026) -- in a window 500 px wide the sentence mostly fell
           to a line of its own. -->
    </div>

    <p
      v-if="showRemaining"
      :id="remainingId"
      class="chat-compose-note"
      data-test="chat-compose-remaining"
    >
      {{ t('chatThread.remaining', { n: remaining }, remaining) }}
    </p>
    <!-- ⛔ Where it went wrong, and not in a toast: the text is still in the field above, and
         this line says that it is. `role="alert"` is announced when it is put in. -->
    <p v-if="failed" class="chat-compose-note" role="alert" data-test="chat-compose-failed">
      {{ t('chatThread.notSent') }}
    </p>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { chatNotifyFor } from '@/utils/chatNotify'
import { MESSAGE_MAX_CHARS, message as messageSchema } from '@/validationSchemas'

/**
 * The line under the thread that writes to the person in it (P3, mockup E V03).
 *
 * It only asks: it emits `send` with the text and the wish, and the thread does the sending.
 * Whether it went through, the thread says back through two props -- `sending` while the
 * message is on its way, `failed` when it ends without it -- and only a message that went
 * through empties the field. The text in the field is never lost otherwise.
 */
const props = defineProps({
  /** The other person's name, as the window shows it. */
  name: { type: String, default: '' },
  /** No conversation yet: the message will go out as a mail in any case (E-024). */
  first: { type: Boolean, default: false },
  /** A message is on its way; the button waits. */
  sending: { type: Boolean, default: false },
  /** The last message did not go through; its text is still in the field. */
  failed: { type: Boolean, default: false },
})

const emit = defineEmits(['send'])

const { t } = useI18n()

/**
 * The count of what is left appears only near the end: under every message it would be a
 * number nobody needs. The field itself stops at the server's limit (`maxlength`).
 */
const SHOW_REMAINING_BELOW = 200

const id = useId()
const fieldId = `${id}-field`
const firstId = `${id}-first`
const remainingId = `${id}-remaining`

const root = ref(null)
const field = ref(null)
const text = ref('')
const alsoByEmail = ref(false)

const placeholder = computed(() => t('chatThread.placeholder', { name: props.name }))

/** What is sent: the text without the space around it. */
const body = computed(() => text.value.trim())

/**
 * The same rule the e-mail form holds a message to (1 to 2000 characters), asked of what
 * would be sent -- a field of spaces sends nothing.
 */
const canSend = computed(() => !props.sending && messageSchema.isValidSync(body.value))

/** Counted like `maxlength` counts: the field as typed. */
const remaining = computed(() => MESSAGE_MAX_CHARS - text.value.length)
const showRemaining = computed(() => remaining.value < SHOW_REMAINING_BELOW)

const describedBy = computed(
  () =>
    [props.first ? firstId : null, showRemaining.value ? remainingId : null]
      .filter(Boolean)
      .join(' ') || undefined,
)

/**
 * The field grows with its text: one line empty, up to five, then it scrolls inside (the
 * limit is the stylesheet's `max-height`). The height is measured, not guessed from line
 * breaks -- a long line wraps as well.
 */
const grow = () => {
  const box = field.value
  if (!box) return
  box.style.height = 'auto'
  box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`
}

/**
 * What went out with the last press. The field stays writable while a message is on its way,
 * so what is cleared afterwards is only what went out (coderabbit, PR #3974).
 */
let submitted = null

const submit = () => {
  if (!canSend.value) return
  submitted = { text: text.value, alsoByEmail: alsoByEmail.value }
  emit('send', {
    body: body.value,
    // The enum NAMES the server takes, by the rule the contact window's video invitation
    // follows too (utils/chatNotify.js).
    notify: chatNotifyFor({ first: props.first, alsoByEmail: alsoByEmail.value }),
  })
}

/** Cmd+Enter or Ctrl+Enter sends; Enter alone is a new line (see the template). */
const sendOnModifiedEnter = (event) => {
  if (!(event.metaKey || event.ctrlKey) || event.isComposing) return
  event.preventDefault()
  submit()
}

/**
 * Focus goes back into the field -- unless the member has moved on meanwhile: a tap on the
 * bell while the message was on its way is not taken back.
 */
const focusStaysHere = () => {
  const active = document.activeElement
  return !active || active === document.body || Boolean(root.value?.contains(active))
}

/**
 * A message went through: the field empties, the box is empty again (E-024: the wish is for
 * one message) and the keyboard stays in the field for the next one. A message that did not
 * go through leaves all of it as it was.
 *
 * ⛔ Only what went out is cleared. Text typed while the message was on its way stays, and so
 * does a box the member changed meanwhile: the text in the field is never lost but by sending
 * it.
 */
watch(
  () => props.sending,
  async (now, before) => {
    if (!before || now) return
    const sent = submitted
    submitted = null
    if (props.failed || !sent) return
    if (alsoByEmail.value === sent.alsoByEmail) alsoByEmail.value = false
    if (text.value !== sent.text) return
    text.value = ''
    await nextTick()
    grow()
    if (focusStaysHere()) field.value?.focus({ preventScroll: true })
  },
)
</script>

<style lang="scss" scoped>
/* Under the thread, set apart by a line, over the width of the window. On the sheet it keeps
   its own height and the thread above takes what is left (ContactWindow). */
.chat-compose {
  flex: 0 0 auto;
  margin-top: 0.5rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--bs-border-color, #dee2e6);
}

/* The first message: a quiet sentence on the same light gold as one's own messages. */
.chat-compose-first {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0 0 0.5rem;
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--gold, #c58d38);
  border-radius: 0.5rem;
  background: rgb(197 141 56 / 12%);
  color: var(--bs-body-color);
  font-size: 0.8rem;
  line-height: 1.4;
}

.chat-compose-first-icon {
  flex: 0 0 auto;
  width: 1.1em;
  height: 1.1em;
  margin-top: 0.1em;
}

.chat-compose-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

/* ⚠️ `font-size: 1rem` is not a matter of taste: Safari on the iPhone zooms into any field
   under 16 px the moment it is touched, and the sheet would stand zoomed afterwards.
   `max-height`: five lines of this line-height plus the padding and the border -- beyond
   that the field scrolls inside instead of pushing the thread off the sheet. */
.chat-compose-field {
  flex: 1 1 auto;
  min-width: 0;
  max-height: calc(7em + 0.9rem + 2px);
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 1.2rem;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 1rem;
  line-height: 1.4;
  overflow-y: auto;
  resize: none;
}

/* ⚠️ One line, however long the name: a placeholder that wraps makes the empty field
   scroll, and its second line peeked out under the first (measured at 320 px and with a
   thirty-character name). Chrome cuts it at the edge; where `text-overflow` reaches a
   placeholder it ends in an ellipsis. */
.chat-compose-field::placeholder {
  overflow: hidden;
  color: var(--bs-secondary-color, #6c757d);
  opacity: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The focus as the field's own rim in the wallet's green, doubled by a shadow: as plain to see
   as the ring on the buttons, without a second line around the round field. */
.chat-compose-field:focus-visible {
  border-color: var(--success, #047006);
  outline: 0;
  box-shadow: 0 0 0 1px var(--success, #047006);
}

/* Round and gold, like one's own messages; the paper plane says what it does, the name says
   it to a screen reader. ⚠️ A touch darker than the house gold (`--gold`, #c58d38): white on
   that is 2.9:1, under the 3:1 a symbol needs to be made out (WCAG 1.4.11); #c08935 is 3.06:1,
   and beside the house gold hardly to be told apart (Bernd, 24.09.2026). The spec holds the
   contrast. */
.chat-compose-send {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #c08935;
  color: #fff;
}

.chat-compose-send[aria-disabled='true'] {
  opacity: 0.45;
  cursor: default;
}

.chat-compose-send:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-compose-send-icon {
  width: 1.2rem;
  height: 1.2rem;
}

/* The box and its word; the word wraps beside the box rather than running past the window in
   a long language. */
.chat-compose-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem 0.5rem;
  margin-top: 0.45rem;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8rem;
}

/* May shrink to the width of the bar, never below it: then its word wraps beside the box. */
.chat-compose-check {
  display: flex;
  flex: 0 1 auto;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  margin: 0;
  cursor: pointer;
}

.chat-compose-check-box {
  flex: 0 0 auto;
  width: 1.1rem;
  height: 1.1rem;
  margin: 0.05rem 0 0;
  accent-color: var(--gold, #c58d38);
}

.chat-compose-check-box:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-compose-check-box:checked + .chat-compose-check-text {
  color: var(--bs-body-color);
}

.chat-compose-note {
  margin: 0.35rem 0 0;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.75rem;
}
</style>
