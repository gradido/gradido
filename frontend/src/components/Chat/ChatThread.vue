<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="chat-thread" data-test="chat-thread">
    <!-- The conversation with one person, in the contact window where the placeholder stood
         (E-023), and the line to write to them under it (P3). Nothing here says anything
         about the other side -- no "read", no "online", no "the mail arrived" -- beyond what
         the server says about one's own message: whether it arrived there, and whether a mail
         about it went out or the recipient's mute held it back (E-019, E-034). The wallet adds
         nothing to it. -->
    <p
      v-if="view === 'error'"
      class="chat-thread-box chat-thread-quiet"
      data-test="chat-thread-error"
    >
      {{ t('chatThread.notReachable') }}
    </p>

    <div
      v-else-if="view === 'empty'"
      class="chat-thread-box chat-thread-quiet"
      data-test="chat-thread-empty"
    >
      <i-mdi-chat-outline class="chat-thread-empty-icon" aria-hidden="true" />
      <p class="mb-0">{{ emptyWords }}</p>
    </div>

    <!-- ⛔ A named region, not a live one -- and it stays one now that the other side's
         messages arrive at the bottom by themselves (P4). `role="log"` announces whatever is
         added to it, and an older page, put in front at the reader's own request, is up to
         fifty chat messages read aloud after one press (coderabbit, #3970; LOG-031). What
         arrives by itself is said in one line by the status below instead: "new message from
         …", as one's own is "sent".

         Focusable, because it scrolls and a keyboard has to be able to scroll it -- and
         what can be focused needs a name, which is what the label is for. -->
    <div
      v-else-if="view === 'thread'"
      ref="scroller"
      class="chat-thread-box chat-thread-scroll"
      role="region"
      :aria-label="threadLabel"
      tabindex="0"
      data-test="chat-thread-log"
      @scroll="noteWhereTheReaderIs"
    >
      <div ref="content" class="chat-thread-content">
        <div v-if="hasMore || transfersHaveMore" class="chat-thread-older">
          <!-- ⚠️ `aria-disabled`, not `disabled`: a focused button that is disabled loses its
               focus in Chrome, and a keyboard that pressed it would be nowhere once the page
               is in. The click handler turns a second press away instead. -->
          <button
            type="button"
            class="chat-thread-older-button"
            :aria-disabled="loadingOlder ? 'true' : 'false'"
            data-test="chat-thread-older"
            @click="loadOlder"
          >
            {{ t('chatThread.loadOlder') }}
          </button>
          <!-- `role="alert"`: the region around it announces nothing (see above), and a press
               that brought nothing would pass in silence for whoever cannot see the line. -->
          <p
            v-if="olderFailed"
            class="chat-thread-older-failed"
            role="alert"
            data-test="chat-thread-older-failed"
          >
            {{ t('chatThread.notReachable') }}
          </p>
        </div>

        <!-- A day, then its messages -- and the transfers between the two, where they fall in
             time (Bernd, 28.09.2026). The date stands above the first message of every day the
             thread reaches into, the first one included. -->
        <section v-for="day in days" :key="day.key" class="chat-thread-day-group">
          <h3 class="chat-thread-day" data-test="chat-thread-day">
            <time :datetime="day.key">{{ d(day.date, 'short') }}</time>
          </h3>
          <ol class="chat-thread-list">
            <chat-bubble
              v-for="message in day.messages"
              :key="message.key ?? message.id"
              :data-key="message.key ?? message.id"
              :message="message"
              :alias="inGroup ? groupTitle : alias"
              :in-group="inGroup"
              :show-writer="runStarts.has(message.id)"
              :search-current="searchKey === (message.key ?? message.id)"
              :editing="editing !== null && editing.id === message.id"
              @open-image="openImage"
              @open-member="emit('openMember', $event)"
              @duplicate-video="emit('duplicateVideo', $event)"
              @forward="emit('forwardMessage', $event)"
              @edit="startEdit"
            />
          </ol>
        </section>
      </div>
    </div>

    <!-- Loading: a small box of its own height, so the line under it does not travel far
         when the page lands. -->
    <div v-else class="chat-thread-box chat-thread-loading" data-test="chat-thread-loading" />

    <!-- ⛔ One bar, standing through the change from "nothing written yet" to "a thread": the
         condition holds for both, so it is not made anew when the first message turns the
         one into the other, and the keyboard stays in its field. Not while loading and not
         where the thread could not be loaded -- there is nothing to answer yet. -->
    <!-- In a group (P5) there is no first message to go by mail -- the mail "taken in" was the
         first word -- and the box is the announcement, the owner's and the moderators' only. -->
    <chat-compose-bar
      v-if="view === 'thread' || view === 'empty'"
      ref="composeBar"
      :name="inGroup ? groupTitle : alias"
      :first="!inGroup && state === 'empty'"
      :group="inGroup"
      :can-announce="canAnnounce"
      :announce-to="announceTo"
      :sending="sending"
      :failed="sendFailed"
      :failed-reason="sendRefusal"
      :initial-text="openingText"
      :text-only="textOnly"
      :editing="editingForBar"
      :edit-problem="editProblem"
      @send="send"
      @save-edit="saveEdit"
      @cancel-edit="stopEdit"
    />

    <!-- A picture of the thread, large (P7): a dialog of its own over the contact window. -->
    <chat-image-view />

    <!-- For the ear only: "sent", or "new message from …" when one arrived by itself. Always in
         the page, so the words are announced when they are put in -- a live region that appears
         together with its text is not. -->
    <p class="visually-hidden" role="status" data-test="chat-thread-sent">{{ sentNotice }}</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import ChatBubble from '@/components/Chat/ChatBubble.vue'
import ChatComposeBar from '@/components/Chat/ChatComposeBar.vue'
import ChatImageView from '@/components/Chat/ChatImageView.vue'
import { openChatImageView, rememberChatImage } from '@/composables/useChatImages'
import { useChatTransfers } from '@/composables/useChatTransfers'
import { useChatThreadSearch } from '@/composables/useChatThreadSearch'
import { onChatMessages, onChatMessagesEdited, pollChatNow } from '@/composables/useChatUpdates'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import {
  chatMessagesWithMemberQuery,
  editChatMessage,
  markChatConversationRead,
  sendChatMessage,
} from '@/graphql/chat.graphql'
import {
  chatGroupMessagesQuery,
  markChatGroupRead,
  sendChatGroupMessage,
} from '@/graphql/chatGroups.graphql'
import { chatEditProblem, withChatMessagesEdited } from '@/utils/chatEdit'
import { chatImageRefusal } from '@/utils/chatImage'
import { managesChatGroup } from '@/utils/chatGroupRoles'
import { chatMemberKey } from '@/utils/chatMemberKey'
import { CHAT_NOTIFY_EMAIL } from '@/utils/chatNotify'
import { dropChatReturnNote, noteChatReturn, takeHeldChatText } from '@/utils/chatReturn'
import { readChatVideoInvite } from '@/utils/chatVideoInvite'
import { memberAlias } from '@/utils/gradidoAddress'

/** How many messages a page holds -- the server's own default, written out. */
const PAGE_SIZE = 50

const props = defineProps({
  /**
   * The other person, named by the pair (KF-004): `{ gradidoID, communityUuid }`. Null in a
   * group's thread, which is named by `group` instead.
   */
  member: { type: Object, default: null },
  /**
   * The group this is the thread of (P5), as `chatGroupsQuery` delivers it: its uuid, the
   * conversation its messages carry, its name, the member's own part in it, how many are in it.
   * Null in the thread with one person. One of the two is given; the thread takes it once.
   */
  group: { type: Object, default: null },
  /** Their name, for the thread's accessible name and the writer of their messages. */
  alias: { type: String, default: '' },
  /**
   * The pair as the window keys the thread (`chatMemberKey`: lower case, a missing community
   * written as this one's). It is how the thread knows this person's FIRST message when it
   * arrives in a thread that holds none yet -- there is no conversation id to go by then.
   * Without it the key is made from `member` as it stands.
   */
  memberKey: { type: String, default: '' },
  /**
   * "Hallo …" for the field where the two have no conversation yet (E-055): the contact window
   * hands it in when it was opened from a group. Empty otherwise.
   */
  greeting: { type: String, default: '' },
  /** Only the text, no paperclip: the contact window's first form (E-055). */
  textOnly: { type: Boolean, default: false },
  /**
   * What the window's search field holds (E-057); '' while the search is closed. The thread
   * searches itself for it (useChatThreadSearch) and says what it found (`search`).
   */
  search: { type: String, default: '' },
})

/**
 * `chatConversation`: what the thread knows about the conversation once its first page is in --
 * `{ exists, mutedByMe }`, and again whenever either changes (the first message makes it
 * exist). The window draws its bell from it: one question on opening answers both the thread
 * and the bell (E-017), the window does not ask a second time.
 *
 * `openMember`: in a group, the writer whose name was tapped over their message (E-053).
 *
 * `search`: what the search found (E-057) -- `{ searching, count, current, busy, capped }`, for
 * the window's bar -- whenever any of it changes.
 *
 * `duplicateVideo`: "Duplizieren" under a video invitation (E-058) -- the invitation, for the
 * window's question before a call.
 *
 * `editVideo`: "Bearbeiten" at a video invitation of one's own (E-060) -- `{ message, invitation }`,
 * for the window's question, where its topic and its time are changed. The text of every other
 * message is changed here, in the bar.
 */
const emit = defineEmits([
  'chatConversation',
  'openMember',
  'search',
  'duplicateVideo',
  'forwardMessage',
  'editVideo',
])

const { t, d, n, locale } = useI18n()

/**
 * The pair, taken ONCE. The thread is made when the window opens and gone when it closes
 * (the window is `lazy`), and ContactWindow gives it a new key for another person -- so it
 * never has to follow a member that changes under it. A `communityUuid` of null is this
 * community, as the server reads it.
 */
/**
 * A group's thread (P5) or the thread with one person -- taken once, as the pair is: the group's
 * window gives the thread a new key for another group, as the contact window does for another
 * person.
 */
const inGroup = props.group !== null
const groupUuid = props.group?.groupUuid ?? null

const memberRef = inGroup
  ? null
  : {
      gradidoID: props.member.gradidoID,
      communityUuid: props.member.communityUuid ?? null,
    }

/**
 * What the two kinds of thread are asked by, and the names their answers come under: a group by
 * its uuid (chatGroups.graphql), a person by the pair. Everything else -- pages, arrivals, one's
 * own copy, the read pointer -- goes the same way for both.
 */
const THREAD = inGroup
  ? { query: chatGroupMessagesQuery, page: 'chatGroupMessages', copy: 'sendChatGroupMessage' }
  : { query: chatMessagesWithMemberQuery, page: 'chatMessagesWithMember', copy: 'sendChatMessage' }

/**
 * ⛔ `network-only`: every opening asks the server. A window that showed the answer of the
 * last opening out of the cache would put a thread on screen that is missing whatever was
 * written since -- worse than a moment of an empty box. The answer is still written to the
 * cache, and that is what `fetchMore` merges older pages into; the cache is emptied at
 * logout, so nothing of it reaches the next member on this device.
 */
const threadVariables = inGroup
  ? { groupUuid, limit: PAGE_SIZE }
  : { ref: memberRef, limit: PAGE_SIZE }
const { result, error, fetchMore } = useQuery(THREAD.query, threadVariables, {
  fetchPolicy: 'network-only',
})
const { mutate: markRead } = useMutation(inGroup ? markChatGroupRead : markChatConversationRead)
const { mutate: sendToServer } = useMutation(inGroup ? sendChatGroupMessage : sendChatMessage)
const { mutate: changeOnServer } = useMutation(editChatMessage)
const { client: apolloClient } = useApolloClient()

const page = computed(() => result.value?.[THREAD.page] ?? null)
const messages = computed(() => page.value?.messages ?? [])
const hasMore = computed(() => Boolean(page.value?.hasMore))

/**
 * The transfers between the two (useChatTransfers), beside the messages and apart from them:
 * nothing the chat counts goes by them -- not the read pointer, not the page before the smallest
 * id, not whether the conversation exists. They only stand in the thread where they fall in
 * time, as bubbles of their own.
 */
const store = useStore()
const {
  transfers,
  settled: transfersSettled,
  hasMore: transfersHaveMore,
  loadOlderTransfers,
} = useChatTransfers(apolloClient, memberRef, {
  // The member's own switch (Einstellungen › Nachrichten), on unless switched off: null is a
  // store from before the field. Never in a group: a transfer is between two (E-050 F6).
  enabled: !inGroup && store.state.transfersInChat !== false,
})

/** The group's name, where this is a group's thread (P5). */
const groupTitle = computed(() => props.group?.title ?? '')

/** The thread's name for the ear: whom it is with -- or which group it is. */
const threadLabel = computed(() =>
  inGroup
    ? t('chatGroup.label', { name: groupTitle.value })
    : t('chatThread.label', { name: props.alias }),
)

/**
 * Whether the member opened the group: then everybody else in it had the mail "taken in" from
 * them, and the empty thread says so (the mockup). Anybody else reads only that nothing is written
 * yet -- they were taken in by somebody, or came later.
 */
const openedByMe = computed(
  () =>
    inGroup &&
    Boolean(props.group.createdBy?.gradidoID) &&
    // By the Gradido ID alone, as the group's window asks it: in P5 every member is of this
    // community (E-026).
    props.group.createdBy.gradidoID.toLowerCase() ===
      String(store.state.gradidoID ?? '').toLowerCase(),
)

/** What an empty thread says. Two written-out keys each, for the i18n lint. */
const emptyWords = computed(() => {
  if (!inGroup) return t('chatThread.empty')
  return openedByMe.value ? t('chatGroup.emptyOpened') : t('chatGroup.empty')
})

/**
 * Whether the bar offers the announcement (E-050 F5): the owner and the moderators -- and only
 * where anybody else is in the group to announce to. Read off the group as the window holds it, so
 * a part changed while the window is open counts at once.
 */
const announceTo = computed(() => (inGroup ? Math.max(0, props.group.memberCount - 1) : 0))
const canAnnounce = computed(
  () => inGroup && managesChatGroup(props.group.role) && announceTo.value > 0,
)

/**
 * ⚠️ Decided on the PAGE, not on `loading`. vue-apollo sets `loading` for a `fetchMore` too,
 * and never clears it where the fetch fails -- a thread built on `loading` would vanish
 * while older messages load, and stay gone after one failed to.
 */
const state = computed(() => {
  if (page.value) return messages.value.length ? 'thread' : 'empty'
  if (error.value) return 'error'
  return 'loading'
})

const at = (iso) => new Date(iso).getTime()

/**
 * A transfer as a bubble (Bernd, 28.09.2026): "formatiert wie eine E-Mail, nur etwas kürzer" --
 * the mail's own words bold over it ("Frank-Tisch hat Dir 10,00 Gradido gesendet"; for the one
 * who sent it "Du hast Bernd 10,00 Gradido gesendet"), the booking's memo under them. On the
 * side of whoever sent it, as a message is.
 */
const transferBubble = (booking) => {
  const mine = booking.typeId === 'SEND'
  const amount = n(Math.abs(Number(booking.amount)), 'decimal')
  return {
    key: `transfer-${booking.id}`,
    transfer: true,
    mine,
    createdAt: booking.balanceDate,
    subject: mine
      ? t('chatThread.transferSent', { name: props.alias, amount })
      : t('chatThread.transferReceived', { name: props.alias, amount }),
    body: booking.memo,
    // The thank-you greeting the booking was made from, where it was (ZE-019): the bubble shows
    // its motif and sets its line in handwriting. Null for every other transfer.
    greeting: booking.greeting ?? null,
  }
}

/**
 * How far back the thread can be shown without a gap: while either list has older pages, not
 * past the oldest thing it holds -- a message from before the oldest transfer asked for would
 * stand beside transfers that are not there yet. "Load older" moves it back.
 */
const horizon = computed(() => {
  const limits = []
  if (hasMore.value && messages.value.length) limits.push(at(messages.value[0].createdAt))
  if (transfersHaveMore.value && transfers.value.length) {
    limits.push(at(transfers.value[0].balanceDate))
  }
  return limits.length ? Math.max(...limits) : -Infinity
})

/**
 * The messages in their own order (E-018) with the transfers between them, each before the first
 * message that came after it -- from the horizon on.
 */
const timeline = computed(() => {
  const due = transfers.value.filter((booking) => at(booking.balanceDate) >= horizon.value)
  const shown = []
  let next = 0
  for (const message of messages.value) {
    const when = at(message.createdAt)
    if (when < horizon.value) continue
    while (next < due.length && at(due[next].balanceDate) < when) {
      shown.push(transferBubble(due[next]))
      next += 1
    }
    shown.push(message)
  }
  while (next < due.length) {
    shown.push(transferBubble(due[next]))
    next += 1
  }
  return shown
})

/**
 * What the box shows. The chat's own state (`state`) goes by the messages -- whether the
 * conversation exists, whether the next message is the first -- and the box by all it holds: a
 * pair with transfers and no message yet has a thread to show. "Empty" waits for the transfers,
 * so the empty box does not stand for a moment over transfers on their way.
 */
const view = computed(() => {
  if (state.value === 'error' || state.value === 'loading') return state.value
  if (timeline.value.length > 0) return 'thread'
  return transfersSettled.value ? 'empty' : 'loading'
})

/** The local calendar day of a message: what the date line above a day names. */
const dayKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

/**
 * The timeline, a day at a time. The messages are not sorted: they come in the order they
 * arrived on this server (E-018), an older page in front of the ones already there, and the
 * transfers stand between them by their time.
 */
const days = computed(() => {
  const groups = []
  for (const message of timeline.value) {
    const date = new Date(message.createdAt)
    const key = dayKey(date)
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.messages.push(message)
    } else {
      groups.push({ key, date, messages: [message] })
    }
  }
  return groups
})

/**
 * In a group (P5): the messages that begin a run of the same writer within a day. The face and the
 * name stand over those, and the bubbles after them go without (ChatBubble) -- a date line begins
 * a new run. One's own messages end a run and begin none.
 */
const runStarts = computed(() => {
  const starts = new Set()
  if (!inGroup) return starts
  for (const day of days.value) {
    let before = null
    for (const message of day.messages) {
      const writer = message.mine ? null : chatMemberKey(message.sender)
      if (writer && writer !== before) starts.add(message.id)
      before = writer
    }
  }
  return starts
})

/**
 * The faces of the writers in a group's thread (P5), asked the way the lists ask for theirs:
 * whoever's picture is not on this device yet, in one question; the bubbles draw them from the
 * store (memberAvatarProps). One's own messages carry no face.
 */
if (inGroup) {
  watch(
    messages,
    (list) => {
      const writers = new Map()
      for (const message of list) {
        const writer = message.senderUser
        if (!message.mine && writer?.gradidoID) writers.set(chatMemberKey(writer), writer)
      }
      if (writers.size > 0) fetchMemberAvatars(apolloClient, [...writers.values()])
    },
    { immediate: true },
  )
}

/**
 * The highest id that was on screen while the page was out of sight -- read by nobody yet, so
 * the pointer waits for the page to come back into sight. 0 while nothing waits.
 */
let unseenUpTo = 0

/**
 * Moves the read pointer to the highest id on screen -- but only while the page is in sight
 * (E-017: the pointer is the highest id SHOWN, and a thread in a tab in the background shows
 * nothing to anybody). Otherwise it waits for the page to come back. The window is open, or
 * this thread would not exist: it is made when the window opens and gone when it closes.
 *
 * Once the server has it, the beat asks at once (`pollChatNow`), so the mark in the menu is
 * right within a second and not only with the next beat.
 *
 * `quiet`: the member did nothing to cause this one -- a message arrived, or the page came back
 * into sight -- so it leaves the session clock alone (`renewSession`, plugins/apolloProvider.js).
 *
 * A failure is let go: it leaves these messages counted as unread until the next opening, which
 * is nothing the member is waiting on.
 */
const markShown = (upToMessageId, { quiet = false } = {}) => {
  if (document.hidden) {
    unseenUpTo = Math.max(unseenUpTo, upToMessageId)
    return
  }
  unseenUpTo = 0
  const options = quiet ? { context: { renewSession: false } } : undefined
  const pointer = inGroup ? { groupUuid, upToMessageId } : { ref: memberRef, upToMessageId }
  Promise.resolve(markRead(pointer, options))
    .then(() => pollChatNow())
    .catch(() => {})
}

const onVisibility = () => {
  if (document.hidden || unseenUpTo === 0) return
  markShown(unseenUpTo, { quiet: true })
}
document.addEventListener('visibilitychange', onVisibility)
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibility))

/**
 * The way back into this conversation, should iOS start the wallet over while the member is in
 * another app (utils/chatReturn): noted as the page goes out of sight, let go as it comes back
 * into sight or the thread closes -- whom it is with, and the words in the field not sent yet.
 * After such a start, the words come back into the field (`heldText`, handed over in memory).
 */
const composeBar = ref(null)
/** Whom the way back leads to: the person by the pair, a group by its uuid. */
const returnTo = inGroup ? { groupUuid } : memberRef
const noteReturn = () => {
  if (document.hidden) {
    noteChatReturn(store.state.gradidoID, returnTo, composeBar.value?.draft() ?? '')
  } else {
    dropChatReturnNote(store.state.gradidoID)
  }
}
document.addEventListener('visibilitychange', noteReturn)
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', noteReturn)
  dropChatReturnNote(store.state.gradidoID)
})

/**
 * Whoever wrote a message that is not one's own: the other person in a thread of two; in a group
 * the writer the server named with the message -- their alias, or their id where they have none
 * (memberAlias), also for a member who has left the group since.
 */
const writerOf = (message) =>
  inGroup
    ? memberAlias(
        message.senderUser?.alias,
        message.senderUser?.gradidoID ?? message.sender?.gradidoID,
      )
    : props.alias

/**
 * A picture large (ChatImageView): who sent it -- "Du" for one's own, the other person's name
 * otherwise -- and, for the dialog's name ("Bild von {name}"), one's own name where it is one's own
 * picture. When it arrived, its caption, and the button that opened it, for the focus to go back to.
 */
const openImage = ({ message, image, opener }) => {
  const ownName = store.state.username || store.state.firstName || ''
  openChatImageView({
    imageUuid: image.imageUuid,
    width: image.width,
    height: image.height,
    who: message.mine ? t('chatThread.you') : writerOf(message),
    name: message.mine ? ownName : writerOf(message),
    at: message.createdAt,
    caption: message.body,
    opener,
  })
}

/**
 * The words a start held for this conversation, taken only when the bar can show them -- when
 * the first page is in. Before that they stay where the start put them: a first page that fails
 * shows no bar, and the next opening of the window takes them (coderabbit, PR #3999). A watcher
 * runs before the render it belongs to, so the bar is made with them.
 */
const heldText = ref('')
let heldTaken = false
watch(
  state,
  (now) => {
    if (heldTaken || (now !== 'thread' && now !== 'empty')) return
    heldTaken = true
    heldText.value = takeHeldChatText(returnTo)
  },
  { immediate: true },
)

/**
 * The words the bar begins with: what a start held for this conversation (above), or -- where
 * the two have never written -- the greeting the window handed in (E-055). The bar reads them
 * once, when it is made; a thread with messages begins with an empty field.
 */
const openingText = computed(
  () => heldText.value || (state.value === 'empty' ? props.greeting : ''),
)

/**
 * The read pointer on opening, to the highest id the first page brought (E-017: the marker is
 * the row number). Not for an empty thread -- there is nothing to have read -- not for an older
 * page, which holds only what lies below the pointer anyway, and not for one's own message:
 * one's own never count as unread. The server never moves it back. Messages that arrive later
 * move it themselves (`takeChatArrivals`).
 *
 * ⛔ Decided on the FIRST PAGE, not on the list: a message sent from here lands in the same
 * list, and a thread that opened empty would otherwise move the pointer to one's own message
 * the moment it is there.
 */
let marked = false
watch(page, (firstPage) => {
  if (marked || !firstPage) return
  marked = true
  if (firstPage.messages.length > 0) {
    markShown(Math.max(...firstPage.messages.map((message) => message.id)))
  }
  // Whatever arrived while the page was on its way -- and whatever was changed.
  takeWaitingArrivals()
  takeWaitingEdits()
})

/**
 * What the thread knows about the conversation, told to the window (see `emit` above).
 *
 * ⚠️ Three values watched one by one, not one object: the window keeps the bell's state
 * itself once it is known, and an object made anew on every page would tell it the opening's
 * `mutedByMe` again after every message sent -- undoing a bell the member has just switched.
 * The conversation exists where the thread has messages; the first one sent makes it so.
 */
const chatConversationKnown = computed(() => state.value !== 'loading')
const chatConversationExists = computed(() => state.value === 'thread')
const mutedByMe = computed(() => Boolean(page.value?.mutedByMe))
watch([chatConversationKnown, chatConversationExists, mutedByMe], ([known, exists, muted]) => {
  if (known) emit('chatConversation', { exists, mutedByMe: muted })
})

/** The scrolling box and what it holds, once the thread is on screen. */
const scroller = ref(null)
const content = ref(null)

/**
 * Whether the thread follows its newest message: from the opening until the reader scrolls up,
 * or asks for older messages.
 *
 * ⛔ One scroll to the bottom when the page lands is NOT enough, measured in the probe. The
 * page can land before the window is shown -- the box is still `display: none`, zero high,
 * and the scroll does nothing; the thread then opened at its OLDEST message, in two runs of
 * four. And a font that arrives after the page makes the content taller by a line. So the
 * thread follows the bottom whenever its box or its content changes size (ResizeObserver),
 * for as long as the reader has not gone elsewhere.
 */
let followNewest = true
/** Where the thread itself last put the box, following the newest message. */
let pinnedAt = 0

const scrollToNewest = () => {
  const box = scroller.value
  if (!box) return
  box.scrollTop = box.scrollHeight
  pinnedAt = box.scrollTop
}

/**
 * ⚠️ "Gone elsewhere" means scrolled UP past where the thread put the box -- not merely "not
 * at the bottom". The browser reports the thread's own scroll a frame later, and a font that
 * arrived in between has made the content taller: measured against the new height the report
 * says 20 px short of the bottom, and the thread would have stopped following on its own
 * doing.
 */
const noteWhereTheReaderIs = () => {
  const box = scroller.value
  if (!box) return
  const atBottom = box.scrollHeight - box.clientHeight - box.scrollTop < 2
  followNewest = atBottom || (followNewest && box.scrollTop >= pinnedAt - 1)
}

// The newest message is the one at the bottom, and that is where a thread opens.
watch(
  view,
  (now, before) => {
    if (now === 'thread' && before !== 'thread') scrollToNewest()
  },
  { flush: 'post' },
)

let resizes = null
watch(
  scroller,
  (box) => {
    resizes?.disconnect()
    resizes = null
    if (!box || typeof ResizeObserver === 'undefined') return
    resizes = new ResizeObserver(() => {
      if (followNewest) scrollToNewest()
    })
    resizes.observe(box)
    if (content.value) resizes.observe(content.value)
  },
  { flush: 'post' },
)
onBeforeUnmount(() => resizes?.disconnect())

const loadingOlder = ref(false)
const olderFailed = ref(false)

/**
 * Where the reader stood while an older page is on its way: the distance from the bottom, and
 * whether the keyboard was on the button. Null when no page is on its way.
 */
let placeFromBottom = null
let focusWasOnOlder = false

/**
 * ⚠️ The place is put back once the older messages are ON SCREEN -- after the render, in a
 * watcher -- and not after `await fetchMore()`. Measured in the probe: the call returns before
 * Apollo has written the merged page, so the box was still as high as before, the correction
 * came out as 0, and the reader was thrown to the top of the new page.
 *
 * What was on screen stays where it was, as far from the bottom as before, with the older
 * messages above it. The box sets `overflow-anchor: none` so the browser does not do the same
 * on its own -- browsers that anchor would move it a second time, and Safari would not move
 * it at all.
 */
watch(
  timeline,
  () => {
    const box = scroller.value
    // One's own message, at the bottom: the thread goes down to it (the sender asked it to
    // follow, see `send`). Without this the new bubble would wait for the browser to report
    // a new size, which a test cannot see and a slow phone reports late.
    if (placeFromBottom === null) {
      if (followNewest) scrollToNewest()
      return
    }
    if (box) box.scrollTop = box.scrollHeight - placeFromBottom
    placeFromBottom = null
    // The button goes once the first message and the first transfer are in. Focus that stood
    // on it would fall out of the window; it goes to the thread instead, where the keyboard was.
    if (focusWasOnOlder && !hasMore.value && !transfersHaveMore.value) {
      box?.focus({ preventScroll: true })
    }
    focusWasOnOlder = false
    // What arrived while the older page was on its way, now that the reader's place is kept --
    // and what was changed meanwhile.
    takeWaitingArrivals()
    takeWaitingEdits()
  },
  { flush: 'post' },
)

/** An older page in front of the one on screen. */
const withOlderPage = (previous, { fetchMoreResult }) => {
  const older = fetchMoreResult?.[THREAD.page]
  if (!older) return previous
  return {
    ...previous,
    [THREAD.page]: {
      ...previous[THREAD.page],
      hasMore: older.hasMore,
      messages: [...older.messages, ...previous[THREAD.page].messages],
    },
  }
}

/** The older page on its way, for a second caller to wait for (the search, E-057). */
let olderInFlight = null

/**
 * The page before the smallest id on screen, and the older transfers -- from whichever list the
 * horizon stands at, both where it stands at both; the watcher above keeps the reader's place.
 *
 * True once a page was asked for and came back (or failed -- `olderFailed` says so); false where
 * there was none to ask. A call while a page is on its way waits for that one: the search asks
 * for pages while the member may press "load older" (useChatThreadSearch).
 */
const loadOlder = async (event) => {
  if (loadingOlder.value) {
    await olderInFlight
    return true
  }
  const oldestMessage =
    hasMore.value && messages.value.length ? at(messages.value[0].createdAt) : -Infinity
  const oldestTransfer =
    transfersHaveMore.value && transfers.value.length
      ? at(transfers.value[0].balanceDate)
      : -Infinity
  const olderMessages =
    hasMore.value && messages.value.length > 0 && oldestMessage >= oldestTransfer
  const olderTransfers = transfersHaveMore.value && oldestTransfer >= oldestMessage
  if (!olderMessages && !olderTransfers) return false
  const box = scroller.value
  followNewest = false
  placeFromBottom = box ? box.scrollHeight - box.scrollTop : null
  focusWasOnOlder = Boolean(event?.currentTarget) && document.activeElement === event.currentTarget
  loadingOlder.value = true
  olderFailed.value = false
  olderInFlight = (async () => {
    try {
      await Promise.all([
        olderMessages
          ? fetchMore({
              variables: { before: Math.min(...messages.value.map((message) => message.id)) },
              updateQuery: withOlderPage,
            })
          : null,
        olderTransfers ? loadOlderTransfers() : null,
      ])
    } catch {
      olderFailed.value = true
      placeFromBottom = null
      focusWasOnOlder = false
      takeWaitingArrivals()
      takeWaitingEdits()
    } finally {
      loadingOlder.value = false
    }
  })()
  await olderInFlight
  return true
}

/**
 * The search (E-057, useChatThreadSearch): a hit is put in the middle of the box, and the thread
 * stops following its newest message -- the reader is where the hit is now, as after scrolling up.
 * Only the box moves, not the window around it.
 */
const showItem = (key) => {
  const box = scroller.value
  const item = content.value?.querySelector(`[data-key="${key}"]`)
  if (!box || !item) return
  followNewest = false
  const offset = item.getBoundingClientRect().top - box.getBoundingClientRect().top
  box.scrollTop += offset - Math.max(0, (box.clientHeight - item.offsetHeight) / 2)
}

/** Moves once an older page is on screen: more messages, more transfers, or no more of either. */
const searchProgress = computed(
  () =>
    `${messages.value.length}:${transfers.value.length}:${hasMore.value}:${transfersHaveMore.value}`,
)

const {
  currentKey: searchKey,
  result: searchResult,
  step: searchStep,
} = useChatThreadSearch({
  typed: toRef(props, 'search'),
  timeline,
  canLoadOlder: computed(() => hasMore.value || transfersHaveMore.value),
  loadedCount: computed(() => messages.value.length + transfers.value.length),
  olderFailed,
  progress: searchProgress,
  loadOlder: () => loadOlder(),
  show: showItem,
})
watch(searchResult, (now) => emit('search', now))

/**
 * Arrivals the page can take: not twice (an id the thread holds already -- one's own copy comes
 * back with the next beat, and the known limit of the marker can bring one again), and not
 * below the oldest message on screen while there are older pages: those belong to a page not
 * loaded yet, and hung in here they would stand in front of a gap that "load older" could then
 * never fill (it asks for what lies below the smallest id).
 */
const arrivalsFor = (thread, chatMessages) => {
  const held = new Set(thread.messages.map((message) => message.id))
  const oldest = thread.messages[0]?.id
  return chatMessages.filter(
    (message) =>
      !held.has(message.id) && !(thread.hasMore && oldest !== undefined && message.id < oldest),
  )
}

/**
 * The arrivals in the page on screen, in the order of their ids -- the order in which they came
 * to this server (E-018). The same way into the same list as one's own copy (`withOwnCopy`).
 */
const withArrivals = (current, arrivals) => {
  const thread = current?.[THREAD.page]
  if (!thread || arrivals.length === 0) return undefined
  return {
    ...current,
    [THREAD.page]: {
      ...thread,
      messages: [...thread.messages, ...arrivals].sort((a, b) => a.id - b.id),
    },
  }
}

/**
 * One's own copy into the page on screen, the way every arrival goes: by its id, and not twice
 * -- the beat brings the same copy again a moment later. Its id is nearly always the highest
 * on this server, it was stored a moment ago; a message of the other side that the beat brought
 * while this one was on its way can have been stored first, and then stands before it.
 */
const withOwnCopy = (current, own) => {
  const thread = current?.[THREAD.page]
  if (!thread) return undefined
  return withArrivals(current, arrivalsFor(thread, [own]))
}

/**
 * Which conversation the arrivals are to be looked for in. A group's is known from the start (P5):
 * the conversation its messages carry. The thread with a person takes the one the messages on
 * screen name, or -- in a thread that holds none yet -- the one this person's first message names,
 * known by the pair of its writer.
 *
 * ⛔ Not a message they wrote in a group (`groupUuid`, build plan P5 Falle 1): it has the same
 * writer, and an empty thread would take the group's conversation for theirs -- the group's
 * messages would then stand in the thread of two.
 *
 * ⚠️ One's own message written into an empty thread from another device names no recipient,
 * so it cannot be told from one to somebody else; it shows with the next opening.
 */
const chatConversationFor = (chatMessages) => {
  if (inGroup) return props.group.conversationId
  return (
    messages.value[0]?.conversationId ??
    chatMessages.find(
      (message) =>
        !message.mine &&
        !message.groupUuid &&
        chatMemberKey(message.sender) === (props.memberKey || chatMemberKey(props.member)),
    )?.conversationId ??
    null
  )
}

/**
 * Messages handed on by the beat, held until the page can take them: while the first page is
 * on its way (it may or may not hold them) and while an older page is (its landing puts the
 * reader's place back, and a message added in between would take that place for its own).
 */
let waitingArrivals = []

const takeWaitingArrivals = () => {
  if (!page.value || placeFromBottom !== null || waitingArrivals.length === 0) return
  const chatMessages = waitingArrivals
  waitingArrivals = []
  const chatConversationId = chatConversationFor(chatMessages)
  if (chatConversationId === null) return
  const ours = chatMessages.filter((message) => message.conversationId === chatConversationId)
  if (ours.length === 0) return

  let added = []
  apolloClient.cache.updateQuery({ query: THREAD.query, variables: threadVariables }, (current) => {
    if (!current?.[THREAD.page]) return undefined
    added = arrivalsFor(current[THREAD.page], ours)
    return withArrivals(current, added)
  })
  // Only what the other side wrote is news: one's own copies arrive too, and say nothing. In a
  // group, who wrote the last of them.
  const theirs = added.filter((message) => !message.mine)
  if (theirs.length === 0) return
  announce(t('chatThread.arrived', { name: writerOf(theirs[theirs.length - 1]) }))
  markShown(Math.max(...added.map((message) => message.id)), { quiet: true })
}

/**
 * The beat's messages (useChatUpdates), all conversations at once; this thread takes its own.
 * Nothing while the thread could not be loaded -- there is no page to hang them into, and the
 * next opening asks anew.
 */
const takeChatArrivals = (chatMessages) => {
  if (state.value === 'error') return
  waitingArrivals.push(...chatMessages)
  takeWaitingArrivals()
}
const stopArrivals = onChatMessages(takeChatArrivals)
onBeforeUnmount(stopArrivals)

/**
 * The page on screen with the changed messages in the place of the ones it holds (E-060), and
 * which of them were in fact another message than the one held (withChatMessagesEdited). Nothing
 * to write where none was: the same change comes again with the next beats for some seconds.
 */
const withChanges = (current, edited) => {
  const thread = current?.[THREAD.page]
  if (!thread) return { next: undefined, changed: [] }
  const { messages, changed } = withChatMessagesEdited(thread.messages, edited)
  return {
    next: changed.length > 0 ? { ...current, [THREAD.page]: { ...thread, messages } } : undefined,
    changed,
  }
}

/**
 * Changed messages -- the beat's, and one's own as the server answered them (`change`) -- held
 * until the page can take them: while the first page is on its way (it may have left the server
 * before the change, and the change would then be lost between the two), and while an older page
 * is (its landing puts the reader's place back by the next change of the thread, and a text
 * changed in between would take that place for its own -- as an arrival would).
 */
let waitingEdits = []

/**
 * The changes into the page: each takes the place of the message the thread holds under its id --
 * of any conversation, since a message this thread does not hold is passed over, and so is a
 * state older than the one it holds (withChatMessagesEdited). Somebody else's change is said in
 * the status, once: "… hat eine Nachricht geändert".
 */
const takeWaitingEdits = () => {
  if (!page.value || placeFromBottom !== null || waitingEdits.length === 0) return
  const edited = waitingEdits
  waitingEdits = []
  let changed = []
  apolloClient.cache.updateQuery({ query: THREAD.query, variables: threadVariables }, (current) => {
    const taken = withChanges(current, edited)
    changed = taken.changed
    return taken.next
  })
  const theirs = changed.filter((message) => !message.mine)
  if (theirs.length === 0) return
  announce(t('chatThread.editedBy', { name: writerOf(theirs[theirs.length - 1]) }))
}

/**
 * The beat's changed messages (useChatUpdates), all conversations at once -- and one's own change,
 * as the server answered it. Nothing while the thread could not be loaded, as for an arrival.
 */
const takeChatEdits = (edited) => {
  if (state.value === 'error') return
  waitingEdits.push(...edited)
  takeWaitingEdits()
}
const stopEdits = onChatMessagesEdited(takeChatEdits)
onBeforeUnmount(stopEdits)

/**
 * How many messages are on their way. The bar's own and a video invitation the window sends
 * (`deliver`) can be out at the same time: a message across the border takes its seconds, and a
 * call may be started meanwhile.
 */
const messagesUnderway = ref(0)
/** While a message is on its way -- the bar's or the window's; the bar's button waits for it. */
const sending = computed(() => messagesUnderway.value > 0)
/** The bar's last message did not go through; the bar keeps its text and says so. */
const sendFailed = ref(false)
/**
 * Why, where the server refused it for its picture (chatImageRefusal): IMAGE_NOT_ACCEPTED or
 * TOO_LARGE_ACROSS_BORDER -- the bar has words of its own for these two. Empty otherwise.
 */
const sendRefusal = ref('')
/** What the status says to a screen reader: a message has gone, or one has arrived. */
const sentNotice = ref('')

/**
 * Puts a line into the status, emptied first: the same words twice in a row -- two messages
 * from the same person -- would otherwise change nothing in the page and be announced once.
 */
const announce = async (text) => {
  sentNotice.value = ''
  await nextTick()
  sentNotice.value = text
}

/**
 * "Sent" -- or the same word the bubble shows where the copy came back not delivered (E-019):
 * whoever cannot see the bubble would otherwise hear "sent" over a message that did not arrive.
 * Where a mail was asked for and the recipient's mute held it back, "sent" and then the line the
 * bubble shows (E-034): the thread is no live region, so the status is the only place a screen
 * reader hears it at the moment it happens. The enum NAMES, as ChatBubble compares them.
 */
const noticeFor = (own) => {
  if (own?.deliveryState === 'FAILED') return t('chatThread.failed')
  if (own?.deliveryState === 'PENDING') return t('chatThread.pending')
  // Not in a group: the note names the one recipient whose mute held the mail back, and a group's
  // announcement has many -- its copy carries no mail state (P5a; coderabbit, #4013).
  if (!inGroup && own?.mailState === 'MUTED') {
    return t('chatThread.sentWithNote', {
      note: t('chatThread.notMailedMuted', { name: props.alias }),
    })
  }
  return t('chatThread.sent')
}

/**
 * Sends one message and hangs the answer -- one's own copy -- under the thread: the one way out
 * of here, for the bar's messages (`send`) and the window's video invitation (`deliver`). The
 * status says what became of it. Never throws: `{ own, refusal }` -- the server's copy, or null
 * where it gave none, and then what the refusal was about where it was about a picture.
 *
 * A picture (P7) goes as `$image` -- ⛔ the name the backend's request log masks (LOG-071): under
 * any other name some 44,000 characters of it would be written to the log with every message.
 * Without one, no `image` at all, rather than a null nobody asked for.
 *
 * ⛔ Into the query's own answer in the cache, not a list of its own and not by asking the
 * server again. Measured with Apollo 3.14 and vue-apollo 4.2 before building: a `network-only`
 * query takes a write to its cache entry without a second request, also after older pages
 * were put in front. So older pages and one's own messages stand in the one list the days are
 * made of, and the page can never hold a message twice or in two orders.
 *
 * ⚠️ It leaves the count of messages on their way to its callers: the bar's `sendFailed` has to
 * change in the same synchronous step as `sending` (see `send`).
 */
/**
 * Where a message goes, and what the sender asked for about mail. In a group (P5) the bar's box is
 * the announcement (E-050 F5): EMAIL from the bar is `announce` -- by mail to every member but
 * the sender who has not muted the group. With a person it is the wish for this one message.
 */
const sendTo = (notify) =>
  inGroup ? { groupUuid, announce: notify === CHAT_NOTIFY_EMAIL } : { ref: memberRef, notify }

const post = async ({ body, notify, image = null }) => {
  sentNotice.value = ''
  // Whoever writes wants to see what they wrote: back to the bottom, even from further up.
  followNewest = true
  try {
    const answer = await sendToServer(
      {
        ...sendTo(notify),
        body,
        ...(image ? { image } : {}),
      },
      {
        update: (cache, { data }) => {
          const own = data?.[THREAD.copy]
          if (!own) return
          // One's own picture from the JPEG just sent (useChatImages): its bubble, drawn with the
          // copy below, shows it without asking the server for what went out from here. Before
          // the copy is written, so the bubble finds it when it is made.
          const filed = own.images?.[0]
          if (filed) rememberChatImage(filed.imageUuid, image?.data)
          cache.updateQuery({ query: THREAD.query, variables: threadVariables }, (current) =>
            withOwnCopy(current, own),
          )
        },
      },
    )
    const own = answer?.data?.[THREAD.copy] ?? null
    if (own) sentNotice.value = noticeFor(own)
    return { own, refusal: null }
  } catch (error) {
    return { own: null, refusal: chatImageRefusal(error) }
  }
}

/**
 * Sends what the bar asks for.
 *
 * ⚠️ `sending` is this thread's own, not the mutation's `loading`: vue-apollo clears `loading`
 * a tick before `mutate` settles, and the bar would read "no longer sending, not failed" in
 * that tick -- as a success, emptying the text of a message that did not go through. Here both
 * flags change together, in one synchronous step -- which is why this does not wait for
 * `deliver` and set `sendFailed` afterwards: the step between the two is exactly such a tick.
 *
 * A delivery that failed across the border is no error: the copy comes back FAILED and the
 * bubble says "not delivered" (E-019). Only an error from the server leaves the text in the
 * bar.
 */
const send = async (message) => {
  if (sending.value) return
  messagesUnderway.value += 1
  sendFailed.value = false
  let outcome = { own: null, refusal: null }
  try {
    outcome = await post(message)
  } finally {
    sendFailed.value = outcome.own === null
    sendRefusal.value = outcome.refusal ?? ''
    messagesUnderway.value -= 1
  }
}

/**
 * A message the window writes for the member: the invitation to a video call (V2). It goes the
 * bar's way -- into the thread, with the status -- and the bar waits for it as for its own. It
 * is not turned away while the bar's message is on its way: the two go out side by side.
 *
 * True where the invitation reached the person: the server gave the copy back, and it did not
 * come back FAILED. A delivery across the border that failed is stored and shown with its word
 * (E-019), but nobody on the other side has the room -- and the window does not open a room that
 * nobody else knows. PENDING is not turned into a failure: the server hands it back only where
 * the outcome of the delivery could not be written down (chatMessageDelivery.ts), so whether it
 * arrived is not known here, and the bubble says "not delivered yet" beside it.
 * The enum NAMES, as the bubble compares them.
 *
 * It carries no picture: the invitation is words and a link.
 *
 * @param {{ body: string, notify: 'EMAIL' | 'NONE' }} message
 * @returns {Promise<boolean>}
 */
const deliver = async ({ body, notify }) => {
  messagesUnderway.value += 1
  let own = null
  try {
    own = (await post({ body, notify })).own
  } finally {
    messagesUnderway.value -= 1
  }
  return own !== null && own.deliveryState !== 'FAILED'
}

/**
 * The message of one's own whose text stands in the bar to be changed (Bernd, 01.10.2026, E-060
 * B1), or null. The bar gets what it needs of it -- the text, and whether a picture goes with it
 * (then the text is its caption and may be emptied) --, the bubble a ring.
 */
const editing = ref(null)
/** Why the last change did not go through (chatEditProblem), or ''. */
const editProblem = ref('')
/**
 * The bar's change whose answer is still out, while the bar still holds its message: null once
 * the answer is in, and once the member let go of the message (✕, Esc). `afterwards` is the id of
 * a message "Bearbeiten" was pressed at meanwhile, which waits for that answer (`startEdit`,
 * `saveEdit`). Nothing is drawn from it.
 */
let changeUnderway = null
const editingForBar = computed(() =>
  editing.value
    ? {
        messageUuid: editing.value.messageUuid,
        body: editing.value.body ?? '',
        hasImage: (editing.value.images?.length ?? 0) > 0,
      }
    : null,
)

/**
 * "Bearbeiten" at a message of one's own. A video invitation -- word for word what the wallet
 * writes for one (readChatVideoInvite) -- goes to the window's question, where its topic and its
 * time are changed and its words written anew. Every other message is changed as the text it is,
 * here in the bar: also one that only carries a room's address among words of one's own, which
 * the question would write over.
 */
const startEdit = (message) => {
  const invitation = readChatVideoInvite({ t, d, locale: locale.value }, message.body)
  if (invitation) {
    emit('editVideo', { message, invitation })
    return
  }
  // "Bearbeiten" once more at the message that is being changed: what was typed since stays in
  // the field, and the keyboard goes back into it.
  if (editing.value?.id === message.id) {
    composeBar.value?.focus()
    return
  }
  // The change of the message in the bar is still on its way: this one waits for its answer
  // (`saveEdit`). Taken at once, the bar would be this message's when the answer comes, and a
  // change that did not go through would have no place to say so, its text gone with the bar.
  if (changeUnderway !== null) {
    changeUnderway.afterwards = message.id
    return
  }
  editProblem.value = ''
  editing.value = message
}

/**
 * The changing let go: the bar gets back what stood in it. An answer still out is no longer the
 * bar's (`saveEdit`), and no other message waits for it.
 */
const stopEdit = () => {
  editing.value = null
  editProblem.value = ''
  changeUnderway = null
}

/**
 * Changes a message on the server and puts the answer -- one's own copy as it stands then -- in
 * the place of the one the page holds: the one way a change of one's own goes, for the bar
 * (`saveEdit`) and the window's video invitation (`edit`). Never throws: '' where it went
 * through, else what the problem was (chatEditProblem). The other members get the new text with
 * their beat.
 *
 * ⛔ The text goes as `$body` -- the name the backend's request log masks.
 *
 * ⛔ `no-cache`, and the copy into the page by the way every change goes (`takeChatEdits`).
 * Apollo would write the answer into the cache by itself -- the message is known there by its id
 * -- at the moment it comes; with an older page on its way that is the next change of the thread,
 * which the reader's place is put back by, and the page that lands afterwards would throw the
 * reader to its top. So the thread writes it, when the page can take it.
 */
const change = async ({ messageUuid, body }) => {
  try {
    const answer = await changeOnServer({ messageUuid, body }, { fetchPolicy: 'no-cache' })
    const own = answer?.data?.editChatMessage
    if (!own) return 'OTHER'
    takeChatEdits([own])
    return ''
  } catch (error) {
    return chatEditProblem(error)
  }
}

/**
 * Saves what the bar asks for. The bar waits while the change is on its way (`sending`), and
 * both -- no longer on its way, and no longer being changed -- turn in one synchronous step, as
 * for a message being sent (see `send`): the bar puts back what stood in it only for a change
 * that went through, and keeps the new text in the field for one that did not.
 *
 * ⛔ The answer speaks to the bar only while the bar still holds the message it is about
 * (`changeUnderway`). The member can let go while it is out (✕, Esc) and take up a message -- this
 * one again, or another: that changing is not the answer's to end, and the line of a change that
 * did not go through is not that message's (coderabbit, PR #4034). A message "Bearbeiten" was
 * pressed at while the bar held this one has waited (`startEdit`): it is taken up once the change
 * went through, as the page holds it then, and not after one that did not -- the bar keeps that
 * one, with its text and the reason.
 */
const saveEdit = async (changed) => {
  if (sending.value) return
  const underway = { afterwards: null }
  changeUnderway = underway
  messagesUnderway.value += 1
  editProblem.value = ''
  let problem = 'OTHER'
  try {
    problem = await change(changed)
  } finally {
    if (changeUnderway === underway) {
      changeUnderway = null
      editProblem.value = problem
      if (!problem) {
        editing.value = messages.value.find((message) => message.id === underway.afterwards) ?? null
      }
    }
    messagesUnderway.value -= 1
  }
  if (!problem) announce(t('chatThread.editSaved'))
}

/**
 * A change the window makes for the member: the new words of a video invitation (E-060). It goes
 * the bar's way -- into the page, with the bar waiting -- and answers '' or what the problem was.
 *
 * @param {{ messageUuid: string, body: string }} changed
 * @returns {Promise<string>}
 */
const edit = async (changed) => {
  messagesUnderway.value += 1
  try {
    return await change(changed)
  } finally {
    messagesUnderway.value -= 1
  }
}

/**
 * `deliver`: a message from outside the bar (the video call's invitation, see above).
 * `edit`: a change from outside the bar (a video invitation's topic and time, E-060).
 * `searchStep`: the window's ↑ and ↓ (E-057) -- -1 to the older hit, +1 to the newer.
 */
defineExpose({ deliver, edit, searchStep })
</script>

<style lang="scss" scoped>
/* Under the head, over the whole width of the window, set apart by a line.

   A column -- the thread, then the bar -- which does nothing where the window gives it no
   height of its own (at the desk it is as high as what it holds) and lets the thread take
   the height between the head and the bar where the window does (the sheet on a phone,
   ContactWindow). `position: relative` keeps the status for screen readers (Bootstrap's
   `.visually-hidden` is `position: absolute`) inside the thread, where a bubble's hidden name
   once hung below the window and made it scroll (see ChatBubble). */
.chat-thread {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--bs-border-color, #dee2e6);
}

/* ⛔ No fixed height any more. P2b gave every state `height: min(45vh, 30rem)` so the window
   would not grow under a finger when the page landed -- and a thread of one message stood at
   the bottom of an empty box, the hole in Bernd's picture (E-031). Now the window sits at the
   top of the screen and grows downwards only (ContactWindow), each state is as high as what
   it shows, and the thread stops growing at its cap and scrolls inside. */
.chat-thread-box {
  flex: 1 1 auto;
  min-height: 0;
}

/* Loading: small, so the bar that comes with the page does not land far below it. */
.chat-thread-loading {
  height: 4rem;
}

.chat-thread-quiet {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  padding: 1rem;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.85rem;
  text-align: center;
}

.chat-thread-empty-icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.6;
}

/* ⚠️ The newest message sits at the BOTTOM of a short thread, where a long one ends too:
   the content is pushed down by `margin-top: auto`, which a scrolling flex box honours
   (unlike `justify-content: flex-end`, which would put the overflow out of reach above).
   `overscroll-behavior` keeps a swipe at either end inside the thread instead of moving the
   page behind the window. */
.chat-thread-scroll {
  display: flex;
  flex-direction: column;

  /* The cap at the desk: as high as its messages, up to here. dvh with vh before it, as
     Scanner and MatchingMap do it: an engine without dvh drops the second line and keeps the
     first. */
  max-height: min(45vh, 30rem);
  max-height: min(45dvh, 30rem);
  overflow-y: auto;
  overflow-anchor: none;
  overscroll-behavior: contain;
  border-radius: 0.5rem;
}

.chat-thread-scroll:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-thread-content {
  margin-top: auto;
  padding: 0 0.15rem 0.25rem;
}

.chat-thread-older {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0 0.5rem;
}

/* A real control without Bootstrap's `.btn`: its own focus ring, and a tap target of at
   least the size a thumb needs. */
.chat-thread-older-button {
  min-height: 2.25rem;
  padding: 0.3rem 0.9rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 1.2rem;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 0.8rem;
}

.chat-thread-older-button:hover {
  border-color: var(--bs-secondary-color, #6c757d);
}

.chat-thread-older-button:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-thread-older-button[aria-disabled='true'] {
  opacity: 0.6;
}

.chat-thread-older-failed {
  margin: 0;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.75rem;
}

/* The date over a day: small and muted in the middle, not a heading's size. ⚠️ On the
   window's own surface and not on a pill of the muted one: the muted grey of dark mode is
   too faint on that (see ChatBubble for the same measure). */
.chat-thread-day {
  margin: 0.6rem 0 0.3rem;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.72rem;
  font-weight: 400;
  line-height: 1.4;
  text-align: center;
}

.chat-thread-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
