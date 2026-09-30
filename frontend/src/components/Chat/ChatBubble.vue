<!-- AI-GENERATED — not an architecture reference -->
<template>
  <li
    ref="row"
    class="chat-bubble-row"
    :class="[
      message.mine ? 'chat-bubble-mine' : 'chat-bubble-theirs',
      {
        'chat-bubble-transfer': message.transfer,
        'chat-bubble-in-group': face,
        'is-search-current': searchCurrent,
        'has-menu': menuOpen,
      },
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
      <!-- The name leads to the writer (E-053): their contact window where they are a contact, else
           the send form -- the page decides. A control of its own beside the face, which opens
           their picture; heard as the button it is, so the bubble below leaves the name out. -->
      <div class="chat-bubble-writer" data-test="chat-bubble-group-writer">
        <name
          :linked-user="groupWriter"
          :with-community="false"
          @open="emit('openMember', $event)"
        />
      </div>
    </template>
    <!-- An announcement (E-050 F5): it went to everybody by mail, or could have -- marked for all
         who read it, as in the mockup. Read out before the message it belongs to. -->
    <div v-if="announced" class="chat-bubble-announcement" data-test="chat-bubble-announcement">
      {{ t('chatGroup.announcement') }}
    </div>
    <!-- A tap on the message opens its menu on a phone (E-059 F1); a link, a picture, a button
         in it do what they do, and a word held to mark it stays marked. On a computer the sign
         beside it opens the menu. -->
    <div class="chat-bubble" :class="{ 'has-image': image }" @click="tapBubble">
      <!-- ⛔ The side is the ONLY thing that says who wrote a message, and a screen reader
           does not see sides. So the writer is named in words, for the ear only. -->
      <span v-if="!writerLinked" class="visually-hidden" data-test="chat-bubble-writer">
        {{ writer }}
      </span>
      <!-- A copy forwarded from another conversation (E-059 F2): who wrote its words first,
           before everything else in it -- a screen reader hears it first too. -->
      <div v-if="forwardedWords" class="chat-bubble-forwarded" data-test="chat-bubble-forwarded">
        <i-mdi-share class="chat-bubble-forwarded-icon" aria-hidden="true" />
        {{ forwardedWords }}
      </div>
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
        <chat-search-text :text="message.subject" />
      </div>
      <!-- A transfer's memo as the booking list shows it (MemoText): its addresses as links, its
           stars as stars -- it is the booking's text, not a chat message. -->
      <memo-text v-if="message.transfer" class="chat-bubble-text" :memo="message.body" />
      <!-- A picture without words has no caption, and no empty line for one. -->
      <chat-message-text v-else-if="message.body" class="chat-bubble-text" :text="message.body" />
      <!-- A planned video call (V5b, Bernd, 27.09.2026): offered to the member's calendar, on
           either side of the conversation -- the time comes out of the invitation's own address
           (chatVideoPlannedCall), and the calendar shows it in this member's time zone. -->
      <!-- And under every video invitation "Duplizieren" (Bernd, 30.09.2026, E-058): the same room
           and topic in the question before a call, a planned one a week on -- for everybody in
           the conversation, as the link is. Beside "In den Kalender" where there is one. -->
      <div v-if="plannedCall || videoInvitation" class="chat-bubble-calendar">
        <button
          v-if="plannedCall"
          type="button"
          class="chat-bubble-calendar-add"
          data-test="chat-bubble-calendar"
          @click="addToCalendar"
        >
          <i-mdi-calendar-plus-outline aria-hidden="true" />
          {{ t('chatThread.videoAddToCalendar') }}
        </button>
        <button
          v-if="videoInvitation"
          type="button"
          class="chat-bubble-calendar-add"
          :aria-label="t('chatThread.videoDuplicateLabel', { topic: videoInvitation.topic })"
          data-test="chat-bubble-duplicate"
          @click="emit('duplicateVideo', videoInvitation)"
        >
          <i-mdi-content-duplicate aria-hidden="true" />
          {{ t('chatThread.videoDuplicate') }}
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
      <!-- "More about this message" (E-059 F1): beside the bubble while the pointer is over the
           message or the keyboard is on it; on a phone out of sight, for the ear -- the tap on the
           message is the way there. -->
      <button
        v-if="hasMenu"
        ref="more"
        type="button"
        class="chat-bubble-more"
        :aria-label="t('chatThread.menuMore')"
        :title="t('chatThread.menuMore')"
        aria-haspopup="true"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        data-test="chat-bubble-more"
        @click.stop="toggleMenu"
      >
        <i-mdi-dots-horizontal aria-hidden="true" />
      </button>
    </div>
    <chat-message-menu
      v-if="menuOpen"
      :mine="message.mine"
      :below="menuBelow"
      :can-forward="canForward"
      :can-copy="canCopy"
      @forward="forward"
      @copy="copyText"
      @keydown.esc.stop.prevent="closeMenu({ focusMore: true })"
    />
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
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatBubbleImage from '@/components/Chat/ChatBubbleImage.vue'
import ChatMessageMenu from '@/components/Chat/ChatMessageMenu.vue'
import ChatMessageText from '@/components/Chat/ChatMessageText'
import ChatTransferCoin from '@/components/Chat/ChatTransferCoin.vue'
import { ChatSearchText } from '@/components/Chat/chatSearchMarks'
import MemoText from '@/components/TransactionRows/MemoText'
import Name from '@/components/TransactionRows/Name.vue'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { LIST_AVATAR_SIZE } from '@/constants'
import { memberAlias } from '@/utils/gradidoAddress'
import { isComputer } from '@/utils/isComputer'
import {
  chatVideoCalendarFile,
  chatVideoCalendarFileName,
  chatVideoCalendarUid,
  chatVideoInvitation,
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
  /** The hit the thread's search stands on (E-057): the bubble is ringed, its marks stronger. */
  searchCurrent: { type: Boolean, default: false },
})

/**
 * `openImage`: the member wants the message's picture large -- `{ message, image, opener }`, the
 * button that was pressed among them (the thread opens the view, ChatImageView).
 */
/**
 * `openImage`: a picture of the message, large (P7). `openMember`: the writer of somebody else's
 * message in a group, named over it (E-053) -- the user the server named with it. `forward`: the
 * message, to be forwarded (E-059) -- the page asks where to.
 */
const emit = defineEmits(['openImage', 'openMember', 'duplicateVideo', 'forward'])

const { t, d } = useI18n()
const { toastSuccess, toastError } = useAppToast()

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

/**
 * Whether the writer's name stands over this bubble as the control that leads to them (E-053):
 * then the ear hears it there, and the name in the bubble would say it twice.
 */
const writerLinked = computed(() => Boolean(face.value) && props.showWriter)

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
 * The video invitation this message is (E-058), for "Duplizieren": its room, its topic and, planned,
 * its time. None in a transfer, whose words are the booking's memo.
 */
const videoInvitation = computed(() =>
  props.message.transfer ? null : chatVideoInvitation(props.message.body),
)

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

/**
 * Over a copy forwarded from another conversation (E-059 F2): "Weitergeleitet von [Nutzername]",
 * the name of whoever wrote its words first; "Weitergeleitet" alone where the copy names nobody --
 * the sender forwarded words of their own, or the first writer is not known here. Nothing over any
 * other message.
 */
const forwardedWords = computed(() => {
  if (!props.message.forwarded) return ''
  const from = props.message.forwardedFrom
  return from
    ? t('chatThread.forwardedFrom', { name: memberAlias(from.alias, from.gradidoID) })
    : t('chatThread.forwarded')
})

/**
 * What the menu at the message offers (E-059): forwarding for every message of the conversation --
 * a transfer is none, and has no row to forward --, and its text to copy where it has one.
 */
const canForward = computed(() => !props.message.transfer && Boolean(props.message.messageUuid))
const textToCopy = computed(() =>
  props.message.transfer
    ? ''
    : [props.message.subject, props.message.body].filter((part) => part?.trim()).join('\n\n'),
)
const canCopy = computed(() => Boolean(textToCopy.value))
const hasMenu = computed(() => canForward.value || canCopy.value)

const row = ref(null)
const more = ref(null)
const menuOpen = ref(false)
/** No room above the message in the thread's box: the menu opens under it. */
const menuBelow = ref(false)
/** The room the menu needs above the message -- two entries and their frame. */
const MENU_ROOM_PX = 140

const closeOnPressElsewhere = (event) => {
  if (!row.value?.contains(event.target)) closeMenu()
}

const openMenu = async () => {
  const box = row.value?.closest('.chat-thread-box')
  menuBelow.value = Boolean(
    box && row.value.getBoundingClientRect().top - box.getBoundingClientRect().top < MENU_ROOM_PX,
  )
  menuOpen.value = true
  // Another message's menu closes as this one opens: the press was elsewhere for it.
  document.addEventListener('pointerdown', closeOnPressElsewhere, true)
  await nextTick()
  row.value?.querySelector('.chat-message-menu button')?.focus({ preventScroll: true })
}

const closeMenu = ({ focusMore = false } = {}) => {
  if (!menuOpen.value) return
  menuOpen.value = false
  document.removeEventListener('pointerdown', closeOnPressElsewhere, true)
  if (focusMore) more.value?.focus({ preventScroll: true })
}
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnPressElsewhere, true))

const toggleMenu = () => (menuOpen.value ? closeMenu({ focusMore: true }) : openMenu())

/** What in a message is a control of its own: a tap there does what it does. */
const CONTROLS = 'a, button, input, label, select, textarea, [role="button"]'

/**
 * A tap on the message, on a phone (E-059 F1): opens its menu, or closes it again. Not on a
 * computer -- a click there places the cursor or starts marking words, and the sign beside the
 * message is the way to the menu --, not on a control in the message, not where words are marked.
 */
const tapBubble = (event) => {
  if (!hasMenu.value || isComputer()) return
  if (event.target?.closest?.(CONTROLS)) return
  if (window.getSelection?.()?.toString()) return
  toggleMenu()
}

const forward = () => {
  closeMenu()
  emit('forward', props.message)
}

/** "Text kopieren" (E-059 F6): the subject and the text as they were written. */
const copyText = async () => {
  closeMenu({ focusMore: true })
  try {
    await navigator.clipboard.writeText(textToCopy.value)
    toastSuccess(t('chatThread.textCopied'))
  } catch {
    // Refused, or no clipboard at all.
    toastError(t('chatThread.textNotCopied'))
  }
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
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

/* `position: relative`: the menu at a message (E-059) stands over or under it. */
.chat-bubble-row {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0.25rem 0;
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

/* The message whose menu is open (E-059): ringed in the wallet's green, as the search rings its
   hit. After the bubble's own rules, which it outweighs. */
.chat-bubble-row.has-menu .chat-bubble {
  box-shadow: 0 0 0 2px var(--success, #047006);
}

/* "Weitergeleitet von …" over a forwarded copy (E-059), small and in the muted colour of the time
   under it (below). */
.chat-bubble-forwarded {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.15rem;
  font-size: 0.75rem;
  font-style: italic;
  line-height: 1.3;
}

.chat-bubble-forwarded-icon {
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
}

/* "More about this message" (E-059 F1): beside the bubble, at its middle, on the side towards the
   thread's middle -- seen while the pointer is over the message, the keyboard is on the sign, or
   its menu is open. 44 px to hit. */
.chat-bubble-more {
  position: absolute;
  top: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1.3rem;
  opacity: 0;
  cursor: pointer;
  transform: translateY(-50%);
}

.chat-bubble-more:hover {
  background: var(--surface-muted, #f2f4f6);
  color: var(--bs-body-color);
}

.chat-bubble-more:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
  opacity: 1;
}

.chat-bubble-more[aria-expanded='true'] {
  opacity: 1;
}

/* On a phone the tap on the message opens its menu: the sign is out of sight there, and stays for
   a screen reader -- and for a keyboard, which shows it again. */
@media (hover: none) {
  .chat-bubble-more:not(:focus-visible) {
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
}

.chat-bubble-theirs .chat-bubble-more {
  right: -3rem;
}

.chat-bubble-mine .chat-bubble-more {
  left: -3rem;
}

.chat-bubble-row:hover .chat-bubble-more {
  opacity: 1;
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
.chat-bubble-not-mailed,
.chat-bubble-forwarded {
  color: var(--bs-secondary-color, #6c757d);
}

.dark-mode .chat-bubble-meta,
.dark-mode .chat-bubble-state,
.dark-mode .chat-bubble-not-mailed,
.dark-mode .chat-bubble-forwarded {
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

<style lang="scss">
/* Block comments only: lightningcss parses SFC style blocks, and a double slash is not a comment
   to it.

   The hits of the thread's search (E-057), marked where they stand -- in the words, the subject,
   a transfer's memo, a link's text. Not scoped: the marks are made by render functions
   (chatSearchMarks) inside this bubble, which carry no scope of this file. The same warm yellow in
   both themes, with a dark text on it, so a hit reads alike on the grey, the gold and the dark
   bubble; the hit the search stands on in a stronger orange, and its bubble ringed. */
.chat-bubble-row .chat-search-mark {
  padding: 0 0.05em;
  border-radius: 0.15em;
  background: #ffe58f;
  color: #1d1d1b;
}

.chat-bubble-row.is-search-current .chat-search-mark {
  background: #ffb340;
}

.chat-bubble-row.is-search-current .chat-bubble {
  outline: 2px solid #ffb340;
  outline-offset: 2px;
}
</style>
