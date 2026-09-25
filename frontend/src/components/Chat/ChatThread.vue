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
      v-if="state === 'error'"
      class="chat-thread-box chat-thread-quiet"
      data-test="chat-thread-error"
    >
      {{ t('chatThread.notReachable') }}
    </p>

    <div
      v-else-if="state === 'empty'"
      class="chat-thread-box chat-thread-quiet"
      data-test="chat-thread-empty"
    >
      <i-mdi-chat-outline class="chat-thread-empty-icon" aria-hidden="true" />
      <p class="mb-0">{{ t('chatThread.empty') }}</p>
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
      v-else-if="state === 'thread'"
      ref="scroller"
      class="chat-thread-box chat-thread-scroll"
      role="region"
      :aria-label="t('chatThread.label', { name: alias })"
      tabindex="0"
      data-test="chat-thread-log"
      @scroll="noteWhereTheReaderIs"
    >
      <div ref="content" class="chat-thread-content">
        <div v-if="hasMore" class="chat-thread-older">
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

        <!-- A day, then its messages. The date stands above the first message of every day
             the thread reaches into, the first one included. -->
        <section v-for="day in days" :key="day.key" class="chat-thread-day-group">
          <h3 class="chat-thread-day" data-test="chat-thread-day">
            <time :datetime="day.key">{{ d(day.date, 'short') }}</time>
          </h3>
          <ol class="chat-thread-list">
            <chat-bubble
              v-for="message in day.messages"
              :key="message.id"
              :message="message"
              :alias="alias"
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
    <chat-compose-bar
      v-if="state === 'thread' || state === 'empty'"
      :name="alias"
      :first="state === 'empty'"
      :sending="sending"
      :failed="sendFailed"
      @send="send"
    />

    <!-- For the ear only: "sent", or "new message from …" when one arrived by itself. Always in
         the page, so the words are announced when they are put in -- a live region that appears
         together with its text is not. -->
    <p class="visually-hidden" role="status" data-test="chat-thread-sent">{{ sentNotice }}</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import ChatBubble from '@/components/Chat/ChatBubble.vue'
import ChatComposeBar from '@/components/Chat/ChatComposeBar.vue'
import { onChatMessages, pollChatNow } from '@/composables/useChatUpdates'
import {
  chatMessagesWithMemberQuery,
  markChatConversationRead,
  sendChatMessage,
} from '@/graphql/chat.graphql'
import { chatMemberKey } from '@/utils/chatMemberKey'

/** How many messages a page holds -- the server's own default, written out. */
const PAGE_SIZE = 50

const props = defineProps({
  /** The other person, named by the pair (KF-004): `{ gradidoID, communityUuid }`. */
  member: { type: Object, required: true },
  /** Their name, for the thread's accessible name and the writer of their messages. */
  alias: { type: String, default: '' },
  /**
   * The pair as the window keys the thread (`chatMemberKey`: lower case, a missing community
   * written as this one's). It is how the thread knows this person's FIRST message when it
   * arrives in a thread that holds none yet -- there is no conversation id to go by then.
   * Without it the key is made from `member` as it stands.
   */
  memberKey: { type: String, default: '' },
})

/**
 * `chatConversation`: what the thread knows about the conversation once its first page is in --
 * `{ exists, mutedByMe }`, and again whenever either changes (the first message makes it
 * exist). The window draws its bell from it: one question on opening answers both the thread
 * and the bell (E-017), the window does not ask a second time.
 */
const emit = defineEmits(['chatConversation'])

const { t, d } = useI18n()

/**
 * The pair, taken ONCE. The thread is made when the window opens and gone when it closes
 * (the window is `lazy`), and ContactWindow gives it a new key for another person -- so it
 * never has to follow a member that changes under it. A `communityUuid` of null is this
 * community, as the server reads it.
 */
const memberRef = {
  gradidoID: props.member.gradidoID,
  communityUuid: props.member.communityUuid ?? null,
}

/**
 * ⛔ `network-only`: every opening asks the server. A window that showed the answer of the
 * last opening out of the cache would put a thread on screen that is missing whatever was
 * written since -- worse than a moment of an empty box. The answer is still written to the
 * cache, and that is what `fetchMore` merges older pages into; the cache is emptied at
 * logout, so nothing of it reaches the next member on this device.
 */
const threadVariables = { ref: memberRef, limit: PAGE_SIZE }
const { result, error, fetchMore } = useQuery(chatMessagesWithMemberQuery, threadVariables, {
  fetchPolicy: 'network-only',
})
const { mutate: markRead } = useMutation(markChatConversationRead)
const { mutate: sendToServer } = useMutation(sendChatMessage)
const { client: apolloClient } = useApolloClient()

const page = computed(() => result.value?.chatMessagesWithMember ?? null)
const messages = computed(() => page.value?.messages ?? [])
const hasMore = computed(() => Boolean(page.value?.hasMore))

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

/** The local calendar day of a message: what the date line above a day names. */
const dayKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

/**
 * The messages, a day at a time. Nothing is sorted: they come in the order they arrived on
 * this server (E-018), and an older page is put in front of the ones already there.
 */
const days = computed(() => {
  const groups = []
  for (const message of messages.value) {
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
  Promise.resolve(markRead({ ref: memberRef, upToMessageId }, options))
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
  // Whatever arrived while the page was on its way.
  takeWaitingArrivals()
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
  state,
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
  messages,
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
    // The button goes once the first message is in. Focus that stood on it would fall out
    // of the window; it goes to the thread instead, where the keyboard was.
    if (focusWasOnOlder && !hasMore.value) box?.focus({ preventScroll: true })
    focusWasOnOlder = false
    // What arrived while the older page was on its way, now that the reader's place is kept.
    takeWaitingArrivals()
  },
  { flush: 'post' },
)

/** An older page in front of the one on screen. */
const withOlderPage = (previous, { fetchMoreResult }) => {
  const older = fetchMoreResult?.chatMessagesWithMember
  if (!older) return previous
  return {
    ...previous,
    chatMessagesWithMember: {
      ...previous.chatMessagesWithMember,
      hasMore: older.hasMore,
      messages: [...older.messages, ...previous.chatMessagesWithMember.messages],
    },
  }
}

/** The page before the smallest id on screen; the watcher above keeps the reader's place. */
const loadOlder = async (event) => {
  if (loadingOlder.value || messages.value.length === 0) return
  const box = scroller.value
  followNewest = false
  placeFromBottom = box ? box.scrollHeight - box.scrollTop : null
  focusWasOnOlder = Boolean(event?.currentTarget) && document.activeElement === event.currentTarget
  loadingOlder.value = true
  olderFailed.value = false
  try {
    await fetchMore({
      variables: { before: Math.min(...messages.value.map((message) => message.id)) },
      updateQuery: withOlderPage,
    })
  } catch {
    olderFailed.value = true
    placeFromBottom = null
    focusWasOnOlder = false
    takeWaitingArrivals()
  } finally {
    loadingOlder.value = false
  }
}

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
  const thread = current?.chatMessagesWithMember
  if (!thread || arrivals.length === 0) return undefined
  return {
    ...current,
    chatMessagesWithMember: {
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
  const thread = current?.chatMessagesWithMember
  if (!thread) return undefined
  return withArrivals(current, arrivalsFor(thread, [own]))
}

/**
 * Which conversation the arrivals are to be looked for in: the one the messages on screen
 * name, or -- in a thread that holds none yet -- the one this person's first message names,
 * known by the pair of its writer.
 *
 * ⚠️ One's own message written into an empty thread from another device names no recipient,
 * so it cannot be told from one to somebody else; it shows with the next opening.
 */
const chatConversationFor = (chatMessages) =>
  messages.value[0]?.conversationId ??
  chatMessages.find(
    (message) =>
      !message.mine &&
      chatMemberKey(message.sender) === (props.memberKey || chatMemberKey(props.member)),
  )?.conversationId ??
  null

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
  apolloClient.cache.updateQuery(
    { query: chatMessagesWithMemberQuery, variables: threadVariables },
    (current) => {
      if (!current?.chatMessagesWithMember) return undefined
      added = arrivalsFor(current.chatMessagesWithMember, ours)
      return withArrivals(current, added)
    },
  )
  // Only what the other side wrote is news: one's own copies arrive too, and say nothing.
  if (!added.some((message) => !message.mine)) return
  announce(t('chatThread.arrived', { name: props.alias }))
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

/** While a message is on its way; the bar's button waits for it. */
const sending = ref(false)
/** The last message did not go through; the bar keeps its text and says so. */
const sendFailed = ref(false)
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
  if (own?.mailState === 'MUTED') {
    return t('chatThread.sentWithNote', {
      note: t('chatThread.notMailedMuted', { name: props.alias }),
    })
  }
  return t('chatThread.sent')
}

/**
 * Sends what the bar asks for, and hangs the answer -- one's own copy -- under the thread.
 *
 * ⛔ Into the query's own answer in the cache, not a list of its own and not by asking the
 * server again. Measured with Apollo 3.14 and vue-apollo 4.2 before building: a `network-only`
 * query takes a write to its cache entry without a second request, also after older pages
 * were put in front. So older pages and one's own messages stand in the one list the days are
 * made of, and the page can never hold a message twice or in two orders.
 *
 * ⚠️ `sending` is this thread's own, not the mutation's `loading`: vue-apollo clears `loading`
 * a tick before `mutate` settles, and the bar would read "no longer sending, not failed" in
 * that tick -- as a success, emptying the text of a message that did not go through. Here both
 * flags change together, in one synchronous step.
 *
 * A delivery that failed across the border is no error: the copy comes back FAILED and the
 * bubble says "not delivered" (E-019). Only an error from the server leaves the text in the
 * bar.
 */
const send = async ({ body, notify }) => {
  if (sending.value) return
  sending.value = true
  sendFailed.value = false
  sentNotice.value = ''
  // Whoever writes wants to see what they wrote: back to the bottom, even from further up.
  followNewest = true
  try {
    const answer = await sendToServer(
      { ref: memberRef, body, notify },
      {
        update: (cache, { data }) => {
          const own = data?.sendChatMessage
          if (!own) return
          cache.updateQuery(
            { query: chatMessagesWithMemberQuery, variables: threadVariables },
            (current) => withOwnCopy(current, own),
          )
        },
      },
    )
    sentNotice.value = noticeFor(answer?.data?.sendChatMessage)
  } catch {
    sendFailed.value = true
  } finally {
    sending.value = false
  }
}
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
