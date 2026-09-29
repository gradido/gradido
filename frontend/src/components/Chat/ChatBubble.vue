<!-- AI-GENERATED — not an architecture reference -->
<template>
  <li
    class="chat-bubble-row"
    :class="[
      message.mine ? 'chat-bubble-mine' : 'chat-bubble-theirs',
      { 'chat-bubble-transfer': message.transfer, 'chat-bubble-in-group': face },
    ]"
    :style="face ? { '--chat-bubble-face': `${LIST_AVATAR_SIZE}px` } : undefined"
    data-test="chat-bubble"
  >
    <!-- One message, one list item: the thread is a list (ChatThread). Own messages on the
         right, the other person's on the left (E-014); in a conversation of two there is no
         face at the bubble -- whose it is, the side says. (Inside the item, not above it: a
         comment beside the root would make two roots in development.)

         In a group (P5) the side no longer says who: somebody else's message has their face at
         its left and their name over it -- over the first of a run of theirs, as messengers do,
         the bubbles after it in line with it (the mockup). The name is for the eye: the ear hears
         it inside the bubble, as in a thread of two. -->
    <template v-if="face && showWriter">
      <app-avatar
        class="chat-bubble-face"
        :size="LIST_AVATAR_SIZE"
        :color="'#fff'"
        v-bind="face"
        data-test="chat-bubble-face"
      />
      <div class="chat-bubble-writer" aria-hidden="true" data-test="chat-bubble-group-writer">
        {{ writerName }}
      </div>
    </template>
    <!-- An announcement (E-050 F5): it went to everybody by mail, or could have -- marked for all
         who read it, as in the mockup. Read out before the message it belongs to. -->
    <div v-if="announced" class="chat-bubble-announcement" data-test="chat-bubble-announcement">
      {{ t('chatGroup.announcement') }}
    </div>
    <div class="chat-bubble" :class="{ 'has-image': image }">
      <!-- ⛔ The side is the ONLY thing that says who wrote a message, and a screen reader
           does not see sides. So the writer is named in words, for the ear only. -->
      <span class="visually-hidden" data-test="chat-bubble-writer">{{ writer }}</span>
      <!-- The picture a message carries (P7), on top; its caption is the text under it, in the
           same bubble (E-044 F3). One a message. -->
      <chat-bubble-image
        v-if="image"
        :image="image"
        @open="(opener) => emit('openImage', { message, image, opener })"
      />
      <!-- The subject a message sent from the e-mail form carries, bold over the text; a
           message without one has no line for it at all, not an empty one (E-013). A transfer
           between the two (ChatThread) has the mail's words there, behind the coin. -->
      <div
        v-if="message.subject"
        class="chat-bubble-subject"
        :class="{ 'chat-bubble-transfer-head': message.transfer }"
        data-test="chat-bubble-subject"
      >
        <chat-transfer-coin v-if="message.transfer" />
        <span>{{ message.subject }}</span>
      </div>
      <!-- A transfer's memo as the booking list shows it (MemoText): its addresses as links, its
           stars as stars -- it is the booking's text, not a chat message. -->
      <memo-text v-if="message.transfer" class="chat-bubble-text" :memo="message.body" />
      <!-- A picture without words has no caption, and no empty line for one. -->
      <chat-message-text v-else-if="message.body" class="chat-bubble-text" :text="message.body" />
      <!-- A planned video call (V5b, Bernd, 27.09.2026): offered to the member's calendar, on
           either side of the conversation -- the time comes out of the invitation's own address
           (chatVideoPlannedCall), and the calendar shows it in this member's time zone. -->
      <div v-if="plannedCall" class="chat-bubble-calendar">
        <button
          type="button"
          class="chat-bubble-calendar-add"
          data-test="chat-bubble-calendar"
          @click="addToCalendar"
        >
          <i-mdi-calendar-plus-outline aria-hidden="true" />
          {{ t('chatThread.videoAddToCalendar') }}
        </button>
      </div>
      <div class="chat-bubble-meta">
        <!-- Shown to the sender only, on their own message: a mail about it went out too
             (E-034). Where it did not because the recipient muted the conversation, the line
             under the bubble says so instead (`notMailed`). -->
        <span
          v-if="mailed"
          class="chat-bubble-mailed"
          role="img"
          :aria-label="mailedWords"
          :title="mailedWords"
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
import AppAvatar from '@/components/AppAvatar.vue'
import ChatBubbleImage from '@/components/Chat/ChatBubbleImage.vue'
import ChatMessageText from '@/components/Chat/ChatMessageText'
import ChatTransferCoin from '@/components/Chat/ChatTransferCoin.vue'
import MemoText from '@/components/TransactionRows/MemoText'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { LIST_AVATAR_SIZE } from '@/constants'
import { memberAlias } from '@/utils/gradidoAddress'
import {
  chatVideoCalendarFile,
  chatVideoCalendarFileName,
  chatVideoCalendarUid,
  chatVideoPlannedCall,
  saveChatVideoCalendarFile,
} from '@/utils/chatVideoCalendar'

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
  /** One message of chatMessagesWithMemberQuery -- or of chatGroupMessagesQuery in a group. */
  message: { type: Object, required: true },
  /**
   * The other person's name -- what a screen reader hears over their messages. In a group, the
   * group's name (a planned call's calendar entry is named after it); the writer of a message
   * comes with the message there.
   */
  alias: { type: String, default: '' },
  /** Whether the message stands in a group's thread (P5): then who wrote it is shown at it. */
  inGroup: { type: Boolean, default: false },
  /**
   * In a group: whether the face and the name stand over this message -- the first of a run by
   * the same writer. The thread decides it; it knows the message before.
   */
  showWriter: { type: Boolean, default: true },
})

/**
 * `openImage`: the member wants the message's picture large -- `{ message, image, opener }`, the
 * button that was pressed among them (the thread opens the view, ChatImageView).
 */
const emit = defineEmits(['openImage'])

const { t, d } = useI18n()

/**
 * Who wrote a message of somebody else in a group (P5), as the server named them with it; null in
 * a thread of two, and for one's own. Where their users row is gone the pair stands in, and the
 * face shows no letters.
 */
const groupWriter = computed(() => {
  if (!props.inGroup || props.message.mine) return null
  return (
    props.message.senderUser ?? {
      gradidoID: props.message.sender?.gradidoID,
      communityUuid: props.message.sender?.communityUuid ?? null,
    }
  )
})

/** The name over and in a message: "Du", the writer in a group, the other person otherwise. */
const writerName = computed(() => {
  if (props.message.mine) return t('chatThread.you')
  const user = groupWriter.value
  return user ? memberAlias(user.alias, user.gradidoID) : props.alias
})

/** "You:" or the other person's name, with the colon a listener hears as a pause. */
const writer = computed(() => `${writerName.value}:`)

/**
 * The writer's face beside their message in a group, through the helper every list uses: letters
 * from the alias, colour from the digit the server sent, the picture where there is one -- and then
 * it opens large, as every face does. Null where no face stands (a thread of two, one's own).
 */
const face = computed(() => {
  const user = groupWriter.value
  if (!user) return null
  const base = memberAvatarProps(user)
  return { ...base, ...avatarZoomBindings(user, base) }
})

/** Somebody else's announcement in a group (E-050 F5): the mark over it. */
const announced = computed(
  () => props.inGroup && !props.message.mine && Boolean(props.message.announcement),
)

const arrived = computed(() => new Date(props.message.createdAt))
const arrivedIso = computed(() => arrived.value.toISOString())

/** The picture the message carries (P7): `{ imageUuid, width, height }`, or null. */
const image = computed(() => props.message.images?.[0] ?? null)

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
 * What the envelope says. In a group (P5) one's own mail was an announcement to all (E-050 F5): the
 * bubble says what was asked for, never who got it (E-024).
 */
const mailedWords = computed(() =>
  props.inGroup ? t('chatGroup.announced') : t('chatThread.mailed'),
)

/**
 * The line where no mail went out because the recipient muted the conversation (E-034). There is
 * no "notify anyway": the veto stays with the recipient (E-024), and the sender only learns of it.
 */
const notMailed = computed(() =>
  props.message.mine && props.message.mailState === MAIL_MUTED
    ? t('chatThread.notMailedMuted', { name: props.alias })
    : '',
)

/** The planned video call this message invites to (V5b); null for every other message. */
const plannedCall = computed(() => chatVideoPlannedCall(props.message.body))

/**
 * "Add to calendar": the call as an iCalendar file -- titled with its topic and the other
 * person's name, the invitation as its note, the room as its place. The same call keeps the same
 * name (`uid`), so a second download is the same entry.
 */
const addToCalendar = () => {
  const call = plannedCall.value
  if (!call) return
  saveChatVideoCalendarFile(
    chatVideoCalendarFileName(call.topic, call.start),
    chatVideoCalendarFile({
      start: call.start,
      end: call.end,
      title: `${call.topic} – ${props.alias}`,
      description: props.message.body,
      url: call.url,
      uid: chatVideoCalendarUid(call.room, call.start),
    }),
  )
}
</script>

<style lang="scss" scoped>
/* A transfer's head (Bernd, 28.09.2026): the coin before the mail's words, on their first line
   where they take two. */
.chat-bubble-transfer-head {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
}

.chat-transfer-coin {
  flex: none;
  width: 1.35em;
  height: 1.35em;
  margin-top: 0.05em;
}

/* "Add to calendar" under a planned call's invitation (V5b): a small outlined pill in the gold of
   one's own bubbles, the words in the text colour. */
.chat-bubble-calendar {
  margin-top: 0.4rem;
}

.chat-bubble-calendar-add {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  line-height: 1.3;
  color: var(--bs-body-color);
  background: transparent;
  border: 1px solid var(--gold, #c58d38);
  border-radius: 1rem;
  cursor: pointer;
}

.chat-bubble-calendar-add:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

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

/* In a group (P5): somebody else's messages stand in by a face and a gap, the face at the top of
   the first of a run -- beside the writer's name -- and the bubbles after it in line with it. The
   face is a list's (LIST_AVATAR_SIZE, Bernd 29.09.2026: 48 px as in every list); its size comes
   from the component (`--chat-bubble-face`). */
.chat-bubble-in-group {
  position: relative;
  padding-left: calc(var(--chat-bubble-face, 48px) + 0.45rem);
}

.chat-bubble-face {
  position: absolute;
  top: 0;
  left: 0;
}

/* The writer's name over the first of their run: small and muted, on one line however long -- on
   the window's own surface, where the muted grey reads in both modes (the date line's measure). */
.chat-bubble-writer {
  max-width: 80%;
  margin: 0 0 0.1rem 0.35rem;
  overflow: hidden;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* "Ankündigung" over somebody else's announcement: a small pill in the gold of one's own bubbles,
   the word in the text colour, as "In den Kalender" is drawn. */
.chat-bubble-announcement {
  margin: 0 0 0.15rem 0.35rem;
  padding: 0 0.5rem;
  border: 1px solid var(--gold, #c58d38);
  border-radius: 1rem;
  color: var(--bs-body-color);
  font-size: 0.7rem;
  line-height: 1.5;
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

/* A message with a picture (E-044; the mockup, "Bilder im Faden"): 16.5rem wide, never more than
   80 % of the thread, little room around the picture -- the caption and the time under it keep
   the room text needs. */
.chat-bubble.has-image {
  width: 16.5rem;
  padding: 0.25rem;
}

.chat-bubble.has-image .chat-bubble-text {
  display: block;
  padding: 0.35rem 0.5rem 0;
}

.chat-bubble.has-image .chat-bubble-meta {
  padding: 0 0.5rem 0.15rem;
}
</style>
