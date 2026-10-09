<!-- AI-GENERATED — not an architecture reference -->
<template>
  <li
    ref="row"
    class="chat-bubble-row"
    :class="[
      message.mine ? 'chat-bubble-mine' : 'chat-bubble-theirs',
      {
        'chat-bubble-transfer': message.transfer,
        'chat-bubble-greeting': greeting || transferPicture,
        'chat-bubble-in-group': face,
        'is-search-current': searchCurrent,
        'has-menu': menuOpen,
        'is-editing': editing,
        'is-answered': answering,
        'is-shown': shown,
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
           before everything else in it -- a screen reader hears it first too. The name through
           <i18n-t> with a slot, as ShowFriendsTile has it: the ten languages put it in different
           places (Turkish first), and a slot keeps it text, escaped as any interpolation. A box
           of its own in the line: where the line is too narrow, the name moves to the next line
           whole, instead of breaking at its hyphen ("Carla-" over "Sonne" at 320 px). -->
      <div v-if="message.forwarded" class="chat-bubble-forwarded" data-test="chat-bubble-forwarded">
        <i-mdi-share class="chat-bubble-forwarded-icon" aria-hidden="true" />
        <i18n-t v-if="forwardedName" keypath="chatThread.forwardedFrom" tag="span" scope="global">
          <template #name>
            <span class="chat-bubble-forwarded-name" data-test="chat-bubble-forwarded-name">
              {{ forwardedName }}
            </span>
          </template>
        </i18n-t>
        <span v-else>{{ t('chatThread.forwarded') }}</span>
      </div>
      <!-- The message this one answers (Bernd, 09.10.2026), quoted over it: who wrote it and the
           beginning of its words, each on one line -- a picture named, not shown. A button: a
           press goes to the quoted message in the thread. The ear hears "Antwort auf" first, so
           the name and the words after it are not taken for the message's own. -->
      <button
        v-if="quote"
        type="button"
        class="chat-bubble-quote"
        data-test="chat-bubble-quote"
        @click.stop="emit('showQuoted', message.replyTo)"
      >
        <span class="visually-hidden">{{ t('chatThread.quoteLead') }}</span>
        <span v-if="quote.name" class="chat-bubble-quote-name" data-test="chat-bubble-quote-name">
          {{ quote.name }}
        </span>
        <span class="chat-bubble-quote-text" data-test="chat-bubble-quote-text">
          <i-mdi-image-outline
            v-if="quote.hasImage"
            class="chat-bubble-quote-icon"
            aria-hidden="true"
          />
          {{ quote.text || t('chatThread.imageReady') }}
        </span>
      </button>
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
      <!-- The booking of an accepted thank-you greeting (ZE-019, Bernd, 02.10.2026): under the
           head its motif, its first line in handwriting, and the words -- the memo without that
           line, drawn as a memo is. A greeting of a line alone has no words, and no empty block.
           An <img> and no button: it opens nothing. Its room stands before the file has come,
           so nothing under it moves when it does. What somebody else wrote stands as text. -->
      <template v-if="greeting">
        <!-- A photo of the sender's own in the place of a motif: its small rendition, which the
             two members of the booking may have -- asked for by the id of the link once the
             bubble is in sight. In the same room, and no button either. -->
        <div
          v-if="hasPhoto"
          class="chat-bubble-greeting-picture"
          data-test="chat-bubble-greeting-photo"
        >
          <thank-you-greeting-photo
            class="chat-bubble-greeting-photo"
            :link-id="message.linkId ?? null"
            :alt="t('thank-you-greeting.photo-of', { name: message.greetingSender ?? alias })"
            says-missing
          />
        </div>
        <div v-else-if="motif" class="chat-bubble-greeting-picture">
          <img
            :src="motif.src"
            :alt="motif.name"
            :width="THANK_YOU_MOTIF_WIDTH"
            :height="THANK_YOU_MOTIF_HEIGHT"
            data-test="chat-bubble-greeting-motif"
          />
        </div>
        <div
          v-if="parts.line"
          class="chat-bubble-greeting-line"
          :class="{ 'is-by-hand': byHand }"
          data-test="chat-bubble-greeting-line"
        >
          <chat-search-text :text="parts.line" />
        </div>
        <memo-text v-if="parts.words" class="chat-bubble-text" :memo="parts.words" />
      </template>
      <!-- A transfer the sender added a picture to (ZE-016): under the head the picture, under
           it the memo -- the shape of a greeting's booking without the line in handwriting. In
           the same room, and no button either. A photo is asked for by the id of the BOOKING
           once the bubble is in sight. -->
      <template v-else-if="transferPicture">
        <div
          v-if="transferPicture.photo"
          class="chat-bubble-greeting-picture"
          data-test="chat-bubble-transfer-photo"
        >
          <thank-you-greeting-photo
            class="chat-bubble-greeting-photo"
            :transaction-id="message.transactionId ?? null"
            :alt="t('thank-you-greeting.photo-of', { name: message.greetingSender ?? alias })"
            says-missing
          />
        </div>
        <div v-else class="chat-bubble-greeting-picture">
          <img
            :src="transferPicture.motif.src"
            :alt="transferPicture.motif.name"
            :width="THANK_YOU_MOTIF_WIDTH"
            :height="THANK_YOU_MOTIF_HEIGHT"
            data-test="chat-bubble-transfer-motif"
          />
        </div>
        <memo-text class="chat-bubble-text" :memo="message.body" />
      </template>
      <!-- A transfer's memo as the booking list shows it (MemoText): its addresses as links, its
           stars as stars -- it is the booking's text, not a chat message. -->
      <memo-text v-else-if="message.transfer" class="chat-bubble-text" :memo="message.body" />
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
        <!-- Its writer changed the text since (E-060): the word, before the time -- for
             everybody who reads the message. The earlier text is not kept. -->
        <span v-if="message.editedAt" class="chat-bubble-edited" data-test="chat-bubble-edited">
          {{ t('chatThread.edited') }}
        </span>
        <!-- When it arrived on THIS server; there is no other clock in a conversation
             (E-018). -->
        <time class="chat-bubble-time" :datetime="arrivedIso" data-test="chat-bubble-time">
          {{ d(arrived, 'time') }}
        </time>
      </div>
      <!-- "Options for this message" (E-059 F1): beside the bubble while the pointer is over the
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
      :can-reply="canReply"
      :can-edit="canEdit"
      :video="editsAsVideo"
      :can-forward="canForward"
      :can-copy="canCopy"
      @reply="reply"
      @edit="edit"
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
// The face of the handwriting: declared once for every place that sets a line in it.
import '@/assets/fonts/caveat/caveat.css'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatBubbleImage from '@/components/Chat/ChatBubbleImage.vue'
import ChatMessageMenu from '@/components/Chat/ChatMessageMenu.vue'
import ChatMessageText from '@/components/Chat/ChatMessageText'
import ChatTransferCoin from '@/components/Chat/ChatTransferCoin.vue'
import { ChatSearchText } from '@/components/Chat/chatSearchMarks'
import ThankYouGreetingPhoto from '@/components/ThankYouGreeting/ThankYouGreetingPhoto.vue'
import MemoText from '@/components/TransactionRows/MemoText'
import Name from '@/components/TransactionRows/Name.vue'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { LIST_AVATAR_SIZE } from '@/constants'
import { memberAlias } from '@/utils/gradidoAddress'
import { canWriteByHand } from '@/utils/handwriting'
import { isComputer } from '@/utils/isComputer'
import { greetingParts } from '@/utils/thankYouGreeting'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'
import { transactionPictureShown } from '@/utils/transactionPicture'
import {
  chatVideoCalendarFile,
  chatVideoCalendarFileName,
  chatVideoCalendarUid,
  chatVideoInvitation,
  chatVideoPlannedCall,
  saveChatVideoCalendarFile,
} from '@/utils/chatVideoCalendar'
import { readChatVideoInvite } from '@/utils/chatVideoInvite'

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
  /** The message whose text stands in the bar to be changed (E-060): ringed, as under its menu. */
  editing: { type: Boolean, default: false },
  /** The message the bar's next message answers: ringed, as the one being changed is. */
  answering: { type: Boolean, default: false },
  /** The message a quotation was pressed for, just put in sight: ringed for a moment. */
  shown: { type: Boolean, default: false },
  /**
   * The message this one answers, where the thread holds it: quoted from there, with its words
   * as they stand in the thread -- a change made since the page came is in them. Null where the
   * quoted message is on an older page; the bubble quotes what the server sent then
   * (`message.replyTo`).
   */
  quotedMessage: { type: Object, default: null },
})

/**
 * `openImage`: the member wants the message's picture large -- `{ message, image, opener }`, the
 * button that was pressed among them (the thread opens the view, ChatImageView).
 */
/**
 * `openImage`: a picture of the message, large (P7). `openMember`: the writer of somebody else's
 * message in a group, named over it (E-053) -- the user the server named with it. `forward`: the
 * message, to be forwarded (E-059) -- the page asks where to. `edit`: one's own message, to be
 * changed (E-060) -- the thread puts its text into the bar, or hands a video invitation to the
 * window's question. `reply`: the message, to be answered -- the thread puts it over the bar.
 * `showQuoted`: the quotation over an answer was pressed -- `message.replyTo`, for the thread to
 * go to the quoted message.
 */
const emit = defineEmits([
  'openImage',
  'openMember',
  'duplicateVideo',
  'forward',
  'edit',
  'reply',
  'showQuoted',
])

const { t, d, locale } = useI18n()
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

/**
 * The thank-you greeting a transfer was made from (ZE-019): `{ motif, line, hasPicture }` as the
 * booking list delivers it with the booking of an accepted greeting -- on the sender's side and on
 * the recipient's. Null for every other bubble: a transfer without one stays the bubble it was.
 */
const greeting = computed(() => (props.message.transfer ? (props.message.greeting ?? null) : null))

/** Its picture: none where the greeting has no motif, or one this wallet does not know. */
const motif = computed(() => thankYouMotif(greeting.value?.motif, t))

/** Whether it carries a photo of the sender's own in the place of a motif. */
const hasPhoto = computed(() => greeting.value?.hasPicture === true)

/**
 * The picture the sender added to a transfer (ZE-016), as the bubble shows it: `{ photo: true }`
 * or `{ motif }` -- or null for a transfer without one, and for a motif this wallet does not
 * know: the bubble of a plain transfer then. A booking made from a greeting never has one.
 */
const transferPicture = computed(() =>
  props.message.transfer && !greeting.value
    ? transactionPictureShown(props.message.picture, t)
    : null,
)

/**
 * The line and, apart from it, the words. The booking's memo begins with the line; where it does
 * not, the memo stands whole as the words and no line over it (greetingParts) -- nothing twice,
 * nothing lost.
 */
const parts = computed(() => greetingParts(props.message.body, greeting.value?.line))

/** The LINE decides: one letter the handwriting lacks, and all of it is set in the bubble's font. */
const byHand = computed(() => canWriteByHand(parts.value.line))

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
 * name (`uid`), so a second download is the same entry -- also after the call was changed.
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
      // A call that was changed keeps the name of its first start, and counts its changes
      // (E-060): the calendar moves the entry it holds instead of adding a second one.
      uid: chatVideoCalendarUid(call.room, call.first ?? call.start),
      sequence: call.sequence ?? 0,
    }),
  )
}

/**
 * Over a copy forwarded from another conversation (E-059 F2): "Weitergeleitet von [Nutzername]",
 * with the name of whoever wrote its words first; "Weitergeleitet" alone where the copy names
 * nobody -- the sender forwarded words of their own, or the first writer is not known here ('').
 * Nothing over any other message.
 */
const forwardedName = computed(() => {
  const from = props.message.forwarded ? props.message.forwardedFrom : null
  return from ? memberAlias(from.alias, from.gradidoID) : ''
})

/**
 * The quotation over an answer: `{ name, text, hasImage }`, or null for a message that answers
 * none. The name as a message's writer is named -- "Du", in a group the writer the server named,
 * the other person otherwise. The words on one line, whatever lines the message had; from the
 * message in the thread where it is there, else the beginning the server sent.
 */
const quote = computed(() => {
  const quoted = props.message.replyTo
  if (!quoted) return null
  const live = props.quotedMessage
  const user = quoted.senderUser
  return {
    // Between two the other person; in a group only whom the server named -- `alias` is the
    // group's name there, and nobody's.
    name: quoted.mine
      ? t('chatThread.you')
      : user
        ? memberAlias(user.alias, user.gradidoID)
        : props.inGroup
          ? ''
          : props.alias,
    text: (live ? (live.body ?? '') : (quoted.excerpt ?? '')).replace(/\s+/g, ' ').trim(),
    hasImage: live ? (live.images?.length ?? 0) > 0 : Boolean(quoted.hasImage),
  }
})

/**
 * What the menu at the message offers (E-059): forwarding for every message of the conversation --
 * a transfer is none, and has no row to forward --, and its text to copy where it has one.
 */
const canForward = computed(() => !props.message.transfer && Boolean(props.message.messageUuid))
/** "Antworten": every message the server has filed -- a transfer is a booking, and has no row. */
const canReply = canForward
const textToCopy = computed(() =>
  props.message.transfer
    ? ''
    : [props.message.subject, props.message.body].filter((part) => part?.trim()).join('\n\n'),
)
const canCopy = computed(() => Boolean(textToCopy.value))
/**
 * "Bearbeiten" (E-060): one's own words only -- not somebody else's message, not a transfer (a
 * booking is no chat text), not a forwarded copy (its words are somebody else's), and not a
 * message the server has not filed yet. The server holds the same rules (editChatMessage).
 */
const canEdit = computed(
  () =>
    Boolean(props.message.mine) &&
    !props.message.transfer &&
    !props.message.forwarded &&
    Boolean(props.message.messageUuid),
)
/**
 * Whether "Bearbeiten" changes this message as the video invitation it is -- its topic and its
 * time, in the window's question -- or as the text it is: the menu's line under the word says
 * which. Read as the thread reads it when the entry is pressed (`startEdit`, readChatVideoInvite):
 * a message that only carries a room's address among words of one's own is text. Looked at only
 * while the menu is open.
 */
const editsAsVideo = computed(
  () =>
    canEdit.value &&
    readChatVideoInvite({ t, d, locale: locale.value }, props.message.body) !== null,
)
const menuEntries = computed(() =>
  [canReply.value, canEdit.value, canForward.value, canCopy.value].filter(Boolean),
)
const hasMenu = computed(() => menuEntries.value.length > 0)

const row = ref(null)
const more = ref(null)
const menuOpen = ref(false)
/** No room above the message in the thread: the menu opens under it. */
const menuBelow = ref(false)
/**
 * The room the menu needs above the message: its entries, their frame and its gap. Two entries
 * are 113 px in all ten languages, at 320 and at 1280 px (measured 30.09.2026); three (E-060) are
 * 164 px and 170 with their gap -- 186 where the line under "Bearbeiten" breaks in two, at a video
 * invitation in French and in Greek at 320 px (measured 01.10.2026).
 */
const MENU_ENTRY_PX = 49
const MENU_FRAME_PX = 42
const menuRoom = () => MENU_FRAME_PX + menuEntries.value.length * MENU_ENTRY_PX

const closeOnPressElsewhere = (event) => {
  if (!row.value?.contains(event.target)) closeMenu()
}

/**
 * Over the message, or under it where the thread has no room above it: at its first messages, since
 * the menu stands inside the scrolling thread and nothing scrolls above its beginning. Measured from
 * the thread's beginning, not from what is in sight -- a tall picture half scrolled out at the top
 * has its room above all the same --, and the thread then scrolls just so far that the whole menu
 * is in sight.
 */
const openMenu = async () => {
  const box = row.value?.closest('.chat-thread-box')
  menuBelow.value = Boolean(
    box &&
    row.value.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop <
      menuRoom(),
  )
  menuOpen.value = true
  // Another message's menu closes as this one opens: the press was elsewhere for it.
  document.addEventListener('pointerdown', closeOnPressElsewhere, true)
  await nextTick()
  const menu = row.value?.querySelector('.chat-message-menu')
  menu?.scrollIntoView?.({ block: 'nearest' })
  menu?.querySelector('button')?.focus({ preventScroll: true })
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

/** "Antworten": the message goes up to the thread, which puts it over the bar. */
const reply = () => {
  closeMenu()
  emit('reply', props.message)
}

/** "Bearbeiten" (E-060): the message goes up to the thread, which knows where it is changed. */
const edit = () => {
  closeMenu()
  emit('edit', props.message)
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

/* The booking of an accepted thank-you greeting (ZE-019), and a transfer the sender added a
   picture to (ZE-016). Its bubble takes all the width a bubble may have, however short its
   words: the picture is as wide as the bubble. */
.chat-bubble-greeting .chat-bubble {
  width: 80%;
}

/* The motif, set in as a picture of a message is: 0.25rem from the bubble's edge -- it reaches
   0.5rem into the bubble's 0.75rem of padding -- with the corners of such a picture. The motifs
   are 360 x 250; a ground of their own colour until the file is there, and the picture fills the
   room whole. */
.chat-bubble-greeting-picture {
  margin: 0.4rem -0.5rem 0.5rem;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #fbf3de;
  aspect-ratio: 36 / 25;
}

.chat-bubble-greeting-picture img {
  display: block;
  width: 100%;
  height: 100%;
}

/* A photo, and its room before it has come: as large as the room. */
.chat-bubble-greeting-photo {
  width: 100%;
  height: 100%;
}

/* The first line. As it stands here it is the line with a letter the handwriting lacks: all of
   it in the bubble's font -- no family is named --, italic, in the colour of the handwriting. The
   handwriting is a small face for its size; 1.1em here reads about as large as 1.5em there (the
   sheet's own proportion, RedeemThanksPaper).

   The colour: the brown of the sheet on the light bubbles, a light gold on the dark ones -- the
   bubble follows the theme, the sheet does not. Measured on all four bubbles (the other's and
   one's own, light and dark); the house's gold would not reach 4.5 : 1 on the dark ones. */
.chat-bubble-greeting-line {
  margin: 0 0 0.3rem;
  color: #8a6124;
  font-size: 1.1em;
  font-style: italic;
  line-height: 1.15;
  text-wrap: balance;
}

.dark-mode .chat-bubble-greeting-line {
  color: #e2b55c;
}

/* In handwriting, which is the usual case: one and a half times the bubble's text. Until the
   file is there the line stands upright in the bubble's font. */
.chat-bubble-greeting-line.is-by-hand {
  font-family: Caveat, 'Open Sans', sans-serif;
  font-size: 1.5em;
  font-style: normal;
  font-weight: 600;
}

/* The message whose menu is open (E-059), the one whose text stands in the bar to be changed
   (E-060), the one the bar's next message answers, and the one a quotation led to: ringed in the
   wallet's green, as the search rings its hit. After the bubble's own rules, which it outweighs. */
.chat-bubble-row.has-menu .chat-bubble,
.chat-bubble-row.is-answered .chat-bubble,
.chat-bubble-row.is-shown .chat-bubble,
.chat-bubble-row.is-editing .chat-bubble {
  box-shadow: 0 0 0 2px var(--success, #047006);
}

/* The quotation over an answer: a button without a button's looks, set off by a line at its left
   in the gold of the menus' signs (`--menu-icon`, E-061) -- the house gold comes to 2.6 : 1 on
   the light bubbles, this one reaches the 3 : 1 a sign needs on all four (measured 09.10.2026) --,
   the name, then the words, each on ONE line. Cut off by a
   line clamp and not by `nowrap`: the words may break anywhere, so the quotation asks for no
   width of its own beyond what the bubble may have, and a long one makes the bubble as wide as a
   bubble gets and no wider. */
.chat-bubble-quote {
  display: block;
  width: 100%;
  margin: 0.1rem 0 0.3rem;
  padding: 0.05rem 0 0.05rem 0.5rem;
  border: 0;
  border-left: 3px solid var(--menu-icon, #a8732a);
  border-radius: 0;
  color: inherit;
  font-size: 0.8rem;
  line-height: 1.35;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.chat-bubble-quote:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-bubble-quote-name,
.chat-bubble-quote-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.chat-bubble-quote-name {
  font-weight: 600;
}

.chat-bubble-quote-icon {
  width: 1.05em;
  height: 1.05em;
  vertical-align: -0.15em;
}

/* "Weitergeleitet von …" over a forwarded copy (E-059), small and in the muted colour of the time
   under it (below). */
.chat-bubble-forwarded {
  display: flex;
  align-items: flex-start;
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

.chat-bubble-forwarded-name {
  display: inline-block;
  max-width: 100%;
}

/* "Options for this message" (E-059 F1): beside the bubble, at its middle, on the side towards the
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

/* "bearbeitet" before the time (E-060): the word set apart from the hour by a dot, which is drawn
   and not read out. */
.chat-bubble-edited {
  font-style: italic;
}

.chat-bubble-edited::after {
  margin-left: 0.3rem;
  font-style: normal;
  content: '·';
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
.chat-bubble-forwarded,
.chat-bubble-quote-text {
  color: var(--bs-secondary-color, #6c757d);
}

.dark-mode .chat-bubble-meta,
.dark-mode .chat-bubble-state,
.dark-mode .chat-bubble-not-mailed,
.dark-mode .chat-bubble-forwarded,
.dark-mode .chat-bubble-quote-text {
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

/* The quotation over an answer with a picture: in from the edge as the caption is. */
.chat-bubble.has-image .chat-bubble-quote {
  width: calc(100% - 1rem);
  margin: 0.3rem 0.5rem 0.4rem;
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
