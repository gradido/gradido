<!-- AI-GENERATED — not an architecture reference -->
<template>
  <li
    class="chat-bubble-row"
    :class="message.mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'"
    data-test="chat-bubble"
  >
    <!-- One message, one list item: the thread is a list (ChatThread). Own messages on the
         right, the other person's on the left (E-014); in a conversation of two there is no
         face at the bubble -- whose it is, the side says. (Inside the item, not above it: a
         comment beside the root would make two roots in development.) -->
    <div class="chat-bubble">
      <!-- ⛔ The side is the ONLY thing that says who wrote a message, and a screen reader
           does not see sides. So the writer is named in words, for the ear only. -->
      <span class="visually-hidden" data-test="chat-bubble-writer">{{ writer }}</span>
      <!-- The subject a message sent from the e-mail form carries, bold over the text; a
           message without one has no line for it at all, not an empty one (E-013). -->
      <div v-if="message.subject" class="chat-bubble-subject" data-test="chat-bubble-subject">
        {{ message.subject }}
      </div>
      <chat-message-text class="chat-bubble-text" :text="message.body" />
      <div class="chat-bubble-meta">
        <!-- Shown to the sender only, on their own message: a mail about it went out too
             (E-034). Where it did not because the recipient muted the conversation, the line
             under the bubble says so instead (`notMailed`). -->
        <span
          v-if="mailed"
          class="chat-bubble-mailed"
          role="img"
          :aria-label="t('chatThread.mailed')"
          :title="t('chatThread.mailed')"
          data-test="chat-bubble-mailed"
        >
          <i-mdi-email-outline aria-hidden="true" />
        </span>
        <!-- When it arrived on THIS server; there is no other clock in a conversation
             (E-018). -->
        <time class="chat-bubble-time" :datetime="arrivedIso" data-test="chat-bubble-time">
          {{ d(arrived, 'time') }}
        </time>
      </div>
    </div>
    <!-- ⛔ Only where something is not as it should be. "Delivered" under every message of
         one's own would be the same word a hundred times over; the exception is the
         information. -->
    <div v-if="stateWord" class="chat-bubble-state" data-test="chat-bubble-state">
      {{ stateWord }}
    </div>
    <!-- No mail, and why (E-034, A2): the sender asked for one and the recipient has muted the
         conversation. A sentence, not a sign -- in the list item, so a screen reader reads it
         with the message it belongs to. -->
    <div v-if="notMailed" class="chat-bubble-not-mailed" data-test="chat-bubble-not-mailed">
      {{ notMailed }}
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ChatMessageText from '@/components/Chat/ChatMessageText'

/**
 * ⛔ The enum NAMES, not the column values. The backend registers the database objects
 * (`{ EMAIL: 'email', … }`) as GraphQL enums, and a GraphQL enum goes over the wire by its
 * name -- measured with type-graphql 1.1.1 and graphql 15.10.2, the backend's own versions:
 * a model holding 'email' / 'pending' answers "EMAIL" / "PENDING". A comparison against the
 * lower-case value would never be true, and nothing would say so.
 */
const NOTIFY_EMAIL = 'EMAIL'
const STATE_PENDING = 'PENDING'
const STATE_FAILED = 'FAILED'
const MAIL_MAILED = 'MAILED'
const MAIL_MUTED = 'MUTED'

const props = defineProps({
  /** One message of chatMessagesWithMemberQuery. */
  message: { type: Object, required: true },
  /** The other person's name -- what a screen reader hears over their messages. */
  alias: { type: String, default: '' },
})

const { t, d } = useI18n()

/** "You:" or the other person's name, with the colon a listener hears as a pause. */
const writer = computed(() => `${props.message.mine ? t('chatThread.you') : props.alias}:`)

const arrived = computed(() => new Date(props.message.createdAt))
const arrivedIso = computed(() => arrived.value.toISOString())

/** The word under one's own message, where it did not reach the other server (E-019). */
const stateWord = computed(() => {
  if (!props.message.mine) return ''
  if (props.message.deliveryState === STATE_PENDING) return t('chatThread.pending')
  if (props.message.deliveryState === STATE_FAILED) return t('chatThread.failed')
  return ''
})

/**
 * The envelope: a mail about one's own message went out (E-034). The server fills `mailState`
 * only on one's own messages, so `mine` is asked as well, and a stray value on somebody else's
 * message still draws nothing.
 *
 * MAILED is the server saying so. MUTED -- or a value this wallet does not know -- draws none.
 *
 * ⚠️ Null with the wish EMAIL keeps the envelope it had, the sender's wish (P3b). Null is also
 * what the server answers where it knows nothing: a message from before `mailState`, a
 * recipient's server from before it. Dropping the envelope there would take it off the whole
 * history. The price: a new message whose mail was wanted but did not go out (mail switched
 * off on the server, the transport failed) also shows it -- null cannot tell those apart.
 * Not beside a word that says the message has not arrived: a message that did not reach the
 * other server has not been mailed from there.
 */
const mailed = computed(() => {
  if (!props.message.mine) return false
  if (props.message.mailState === MAIL_MAILED) return true
  if (props.message.mailState) return false
  return props.message.notify === NOTIFY_EMAIL && !stateWord.value
})

/**
 * The line where no mail went out because the recipient muted the conversation (E-034). There is
 * no "notify anyway": the veto stays with the recipient (E-024), and the sender only learns of it.
 */
const notMailed = computed(() =>
  props.message.mine && props.message.mailState === MAIL_MUTED
    ? t('chatThread.notMailedMuted', { name: props.alias })
    : '',
)
</script>

<style lang="scss" scoped>
.chat-bubble-row {
  display: flex;
  flex-direction: column;
  margin: 0.25rem 0;
}

.chat-bubble-mine {
  align-items: flex-end;
}

.chat-bubble-theirs {
  align-items: flex-start;
}

/* ⛔ `position: relative` is not decoration: it keeps the writer's name for screen readers
   (Bootstrap's `.visually-hidden`, which is `position: absolute`) inside the bubble. Without
   it the hidden names were laid out against the window instead of the scrolling thread,
   hung below it, and made the whole window scroll by 143 px on a phone (measured at 390 x 844:
   the modal 987 px high on an 844 px screen).

   `overflow-wrap: anywhere`: a long run without a space -- a pasted link, a row of letters --
   breaks inside the bubble, which never grows past 80% of the thread. Measured with a message
   of 2000 characters and a link of 200: nothing past the window at 390 or 1024 px. */
.chat-bubble {
  position: relative;
  max-width: 80%;
  padding: 0.45rem 0.75rem 0.3rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  color: var(--bs-body-color);
  font-size: 0.9rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

/* The other person's: the muted surface, the corner by their side squared off a little. */
.chat-bubble-theirs .chat-bubble {
  background: var(--surface-muted, #f2f4f6);
  border-bottom-left-radius: 0.3rem;
}

/* One's own: a gold rim on a light gold surface (the mockup, E-029). The gold is the
   wallet's own (`--gold`, set in dark mode; the same value as its fallback here), and the
   surface is that gold thinly over whatever lies below, as FirstCreation's message box does
   -- so it is light on light and dark on dark without a second value. */
.chat-bubble-mine .chat-bubble {
  background: rgb(197 141 56 / 12%);
  border-color: var(--gold, #c58d38);
  border-bottom-right-radius: 0.3rem;
}

.chat-bubble-subject {
  font-weight: 700;
  margin-bottom: 0.1rem;
}

/* The message keeps its own line breaks and spaces, as the mail does (E-012). */
.chat-bubble-text {
  white-space: pre-wrap;
}

.chat-bubble-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  margin-top: 0.1rem;
  font-size: 0.7rem;
}

.chat-bubble-mailed {
  display: inline-flex;
  font-size: 0.85rem;
}

.chat-bubble-state {
  margin-top: 0.15rem;
  font-size: 0.7rem;
}

/* The line where no mail went out (E-034), in the size of the word above it. A sentence, so it
   may take two lines: no wider than a bubble may be, flush with the bubble's side, and a name
   without a space in it -- a Gradido ID stands in for a missing user name -- breaks inside. */
.chat-bubble-not-mailed {
  max-width: 80%;
  margin-top: 0.15rem;
  font-size: 0.7rem;
  line-height: 1.35;
  text-align: right;
  overflow-wrap: anywhere;
}

/* ⚠️ Muted, and in each mode by a different means, because one means does not carry both.
   Small text needs 4.5:1, measured in the probe on every surface these stand on (the two
   bubbles, the window):
   - light: Bootstrap's secondary colour, about 6.3:1 on the bubbles. The body colour at 75%
     would be 3.4:1 there -- the light body colour is a mid grey to begin with.
   - dark: the body colour at 75%, about 6:1. The dark muted grey (`--text-muted`, which is
     what `--bs-secondary-color` is in dark mode) reaches only about 4.2:1 on the bubbles. */
.chat-bubble-meta,
.chat-bubble-state,
.chat-bubble-not-mailed {
  color: var(--bs-secondary-color, #6c757d);
}

.dark-mode .chat-bubble-meta,
.dark-mode .chat-bubble-state,
.dark-mode .chat-bubble-not-mailed {
  color: var(--bs-body-color);
  opacity: 0.75;
}
</style>
