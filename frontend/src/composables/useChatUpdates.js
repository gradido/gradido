// AI-GENERATED — not an architecture reference

import { readonly, ref } from 'vue'
import { newChatMessagesSince } from '@/graphql/chat.graphql'
import { refreshContactsPanel } from '@/composables/useContactsPanel'

/**
 * The chat's one beat (E-017): ONE question -- "what is new for me since this id?" -- asked for
 * the whole app, every fifteen seconds while the page is in sight. The answer brings the number
 * of conversations with something unread (the mark in the menu) and the messages that arrived
 * since, which go to whoever listens: the thread that is open sorts out its own.
 *
 * ⛔ One state for the app, here in the module -- not one per window, and not in the store. The
 * Vuex store is written to `localStorage` in full (createPersistedState without `paths`), so a
 * marker or a message put there would outlive the session on the device. Nothing in this file
 * reads or writes the store or any storage.
 *
 * ⛔ Its own timer around `apolloClient.query`, not `useQuery` with `pollInterval`. Measured with
 * Apollo 3.14 and vue-apollo 4.2.2 before building: with the marker in the variables, every
 * answer that moves it asks again at once, outside the beat; an error is asked again every
 * fifteen seconds, never later; and a `refetch` while an answer is on its way is swallowed, so
 * "ask now" after a message was read got the answer that left before it. Here the beat waits
 * for each answer before it plans the next one, so two questions are never on their way at once.
 *
 * Started by the layout of the signed-in wallet (DashboardLayout) and stopped when it goes, and
 * by the store's logout: nothing of one member's chat reaches the next member on this device.
 */

/** The beat while all is well. A constant of the chat, not CONFIG.AUTO_POLL_INTERVAL (0 on the servers). */
export const CHAT_POLL_INTERVAL_MS = 15000

/** After a failure the pause doubles, up to this; the next answer brings it back to the beat. */
export const CHAT_POLL_BACKOFF_MAX_MS = 120000

/**
 * How many answers in a row while the server says there is more (`hasMore`). After that the
 * contact list is asked again and the rest follows in the next beat (E-017: rather fall back on
 * the list than fetch everything at once).
 */
export const CHAT_POLL_ROUNDS_MAX = 5

/** Messages per answer, the server's own default, written out. */
const CHAT_POLL_PAGE = 50

const unread = ref(0)

/**
 * How many conversations hold something unread, as the server counted them in its last answer
 * -- conversations, not messages; a muted one counts too (E-024). 0 before the first answer and
 * after the logout. Read-only outside this module.
 */
export const chatUnreadConversations = readonly(unread)

const listeners = new Set()

const idle = () => ({
  /** The client the questions go through; null while the beat does not run. */
  client: null,
  /** The id the next question goes on from; null until the first answer said where one stands. */
  marker: null,
  /** The pause before the next question. */
  delay: CHAT_POLL_INTERVAL_MS,
  timer: null,
  /** The questions on their way, one after the other; null while none is. */
  running: null,
  /** "Ask now" came while an answer was on its way: one more round right after it. */
  again: false,
})

let beat = idle()

/**
 * Which start the beat belongs to. An answer that lands after a stop -- a logout, the layout
 * gone -- belongs to a beat that is over, and must not write a number or hand on a message.
 */
let generation = 0

const inSight = () => typeof document === 'undefined' || !document.hidden

/**
 * One question. ⛔ `renewSession: false`: every answer of the server carries a fresh token, and
 * the wallet takes it as a sign of life (plugins/apolloProvider.js). The beat is not the member
 * doing something -- without the flag an open tab would never reach the idle logout.
 *
 * `no-cache`: nothing reads these answers back, and every marker would leave an entry of its own
 * in the store until the logout.
 */
const ask = async (afterId) => {
  const { data } = await beat.client.query({
    query: newChatMessagesSince,
    variables: { afterId, limit: CHAT_POLL_PAGE },
    fetchPolicy: 'no-cache',
    context: { renewSession: false },
  })
  const update = data?.newChatMessagesSince
  if (!update) throw new Error('newChatMessagesSince: no answer')
  return update
}

/** Hands arrived messages on. One listener that fails must not stop the beat for the others. */
const handOn = (chatMessages) => {
  for (const listener of [...listeners]) {
    try {
      listener(chatMessages)
    } catch {
      // The listener's own business; the menu mark and the other threads go on.
    }
  }
}

/**
 * One round of questions: the first one says where one stands (no `afterId`), every later one
 * brings what arrived since the marker -- again at once while the server says there is more, at
 * most `CHAT_POLL_ROUNDS_MAX` times.
 */
const cycle = async (mine) => {
  let arrived = false
  let moved = false
  try {
    let rounds = 0
    let more = false
    do {
      const update = await ask(beat.marker)
      if (mine !== generation) return
      // The number moved without anything arriving: a conversation was read -- here, after
      // `pollChatNow`, or on another device -- and a dot in the contact list goes with it. The
      // first answer only says where one stands; the list was loaded a moment ago.
      if (beat.marker !== null && update.unreadConversations !== unread.value) moved = true
      beat.marker = update.latestId
      unread.value = update.unreadConversations
      if (update.messages.length > 0) {
        arrived = true
        handOn(update.messages)
      }
      more = update.hasMore
      rounds += 1
    } while (more && rounds < CHAT_POLL_ROUNDS_MAX)
    beat.delay = CHAT_POLL_INTERVAL_MS
  } catch {
    if (mine !== generation) return
    beat.delay = Math.min(beat.delay * 2, CHAT_POLL_BACKOFF_MAX_MS)
  }
  // Something arrived, or was read: the contact list, its order and its dots, are the server's
  // (E-023) -- asked again rather than kept in step here.
  if ((arrived || moved) && mine === generation) {
    refreshContactsPanel(beat.client)
  }
}

/** The next question after the pause -- none while the page is out of sight or the beat stopped. */
const schedule = () => {
  clearTimeout(beat.timer)
  beat.timer = null
  if (!beat.client || !inSight()) return
  beat.timer = setTimeout(() => {
    beat.timer = null
    poll()
  }, beat.delay)
}

/**
 * A round now -- or, while one is on its way, one more right after it. Never two at once: the
 * next round is planned only once the answers of this one are in.
 */
const poll = () => {
  if (!beat.client) return Promise.resolve()
  if (beat.running) {
    beat.again = true
    return beat.running
  }
  clearTimeout(beat.timer)
  beat.timer = null
  const mine = generation
  beat.running = cycle(mine).finally(() => {
    if (mine !== generation) return
    beat.running = null
    if (beat.again && inSight()) {
      beat.again = false
      poll()
    } else {
      beat.again = false
      schedule()
    }
  })
  return beat.running
}

/** Out of sight: the beat rests. Back in sight: a question at once, then the beat again. */
const onVisibility = () => {
  if (!beat.client) return
  if (!inSight()) {
    clearTimeout(beat.timer)
    beat.timer = null
    return
  }
  poll()
}

/** Starts the beat for the member signed in; a second start while it runs changes nothing. */
export const startChatUpdates = (apolloClient) => {
  if (beat.client || !apolloClient) return
  beat.client = apolloClient
  document.addEventListener('visibilitychange', onVisibility)
  if (inSight()) poll()
}

/**
 * Stops the beat and forgets where it stood -- the layout gone, or the member signed out. An
 * answer still on its way is dropped when it lands. The listeners are their owners' to remove.
 */
export const stopChatUpdates = () => {
  generation += 1
  clearTimeout(beat.timer)
  if (beat.client) document.removeEventListener('visibilitychange', onVisibility)
  beat = idle()
  unread.value = 0
}

/**
 * A question now, out of turn -- after a message was marked read, so the mark in the menu is
 * right within a second and not only with the next beat. Nothing while the page is out of sight
 * or the beat does not run.
 */
export const pollChatNow = () => (inSight() ? poll() : Promise.resolve())

/**
 * Hands every message that arrives, in the order of the answer (ascending ids), to `listener`,
 * as an array per answer; one's own copies come along (`mine`). Returns the function that ends
 * it. A message can come twice -- the own copy after sending, or after the known limit of the
 * marker -- and whoever keeps a list drops what it already holds.
 */
export const onChatMessages = (listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
