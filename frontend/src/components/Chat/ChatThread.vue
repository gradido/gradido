<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="chat-thread" data-test="chat-thread">
    <!-- The conversation with one person, in the contact window where the placeholder stood
         (E-023). Read only: writing still goes through "send e-mail" until the compose bar
         comes (P3). Nothing here says anything about the other side -- no "read", no
         "online" -- because the server says nothing, and the wallet adds nothing to it. -->
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

    <!-- ⛔ A log (role="log" is polite by default; aria-live spells it out) that exists only
         once the first page is IN. A live region announces what is added to it; one that
         stood empty while the page loaded would have read fifty messages aloud the moment
         they landed.

         Focusable, because it scrolls and a keyboard has to be able to scroll it -- and
         what can be focused needs a name, which is what the label is for. -->
    <div
      v-else-if="state === 'thread'"
      ref="scroller"
      class="chat-thread-box chat-thread-scroll"
      role="log"
      aria-live="polite"
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
          <p
            v-if="olderFailed"
            class="chat-thread-older-failed"
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

    <!-- Loading: the box keeps its height, so nothing in the window moves when the page
         lands. -->
    <div v-else class="chat-thread-box" data-test="chat-thread-loading" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import ChatBubble from '@/components/Chat/ChatBubble.vue'
import { chatMessagesWithMemberQuery, markChatConversationRead } from '@/graphql/chat.graphql'

/** How many messages a page holds -- the server's own default, written out. */
const PAGE_SIZE = 50

const props = defineProps({
  /** The other person, named by the pair (KF-004): `{ gradidoID, communityUuid }`. */
  member: { type: Object, required: true },
  /** Their name, for the thread's accessible name and the writer of their messages. */
  alias: { type: String, default: '' },
})

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
const { result, error, fetchMore } = useQuery(
  chatMessagesWithMemberQuery,
  { ref: memberRef, limit: PAGE_SIZE },
  { fetchPolicy: 'network-only' },
)
const { mutate: markRead } = useMutation(markChatConversationRead)

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
 * The read pointer, moved ONCE per opening, to the highest id the first page brought
 * (E-017: the marker is the row number). Not for an empty thread -- there is nothing to have
 * read -- and not for an older page, which holds only what lies below the pointer anyway.
 * The server never moves it back.
 *
 * A failure is let go: it leaves these messages counted as unread until the next opening,
 * which is nothing the member is waiting on.
 */
let marked = false
watch(messages, (list) => {
  if (marked || list.length === 0) return
  marked = true
  const upToMessageId = Math.max(...list.map((message) => message.id))
  markRead({ ref: memberRef, upToMessageId }).catch(() => {})
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
    if (placeFromBottom === null) return
    const box = scroller.value
    if (box) box.scrollTop = box.scrollHeight - placeFromBottom
    placeFromBottom = null
    // The button goes once the first message is in. Focus that stood on it would fall out
    // of the window; it goes to the thread instead, where the keyboard was.
    if (focusWasOnOlder && !hasMore.value) box?.focus({ preventScroll: true })
    focusWasOnOlder = false
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
  } finally {
    loadingOlder.value = false
  }
}
</script>

<style lang="scss" scoped>
/* Under the grips, over the whole width of the window, set apart by a line. */
.chat-thread {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--bs-border-color, #dee2e6);
}

/* ⚠️ The SAME height in every state -- loading, empty, not reachable, a thread -- so the
   window does not grow or shrink under a finger when the page lands. Big enough for a
   conversation, small enough that on a phone the head, the grips and the thread fit on
   the screen without the page itself scrolling: measured at 390 x 844 and 375 x 667 in
   the probe, see the PR. */
.chat-thread-box {
  height: min(45vh, 30rem);
  min-height: 12rem;
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
