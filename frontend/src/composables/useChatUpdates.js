// AI-GENERATED — not an architecture reference

import { readonly, ref } from 'vue'
import { newChatMessagesSince } from '@/graphql/chat.graphql'
import { refreshContactsPanel } from '@/composables/useContactsPanel'
import {
  forgetContributionsInProgress,
  setContributionsInProgress,
} from '@/composables/useContributionsInProgress'
import { forgetModerationWaiting, setModerationWaiting } from '@/composables/useModerationWaiting'
import { APP_BADGE_HIDDEN_INTERVAL_MS, appBadgeShown, showAppBadge } from '@/utils/appBadge'
import {
  forgetSupportTicketsMenu,
  setSupportTicketsMenu,
} from '@/composables/useSupportTicketsMenu'

/**
 * The chat's one beat (E-017): ONE question -- "what is new for me since this id?" -- asked for
 * the whole app, every fifteen seconds while the page is in sight. The answer brings the number
 * of conversations with something unread (the mark in the menu) and the messages that arrived
 * since, which go to whoever listens: the thread that is open sorts out its own. With them come
 * the messages whose text was changed (E-060), for a thread that holds one to show the new text,
 * and those whose reactions were (Bernd, 11.10.2026).
 *
 * ⛔ One state for the app, here in the module -- not one per window, and not in the store. The
 * store is written to `localStorage` in full (store.js saves it whole), so a
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
 *
 * The document asks three fields more beside the chat's: `supportTicketsMenu` (Support-Anfragen
 * K5), which goes on to useSupportTicketsMenu as it came, `countContributionsInProgress` (the
 * mark at "Schöpfen", Bernd 16.11.2026), which goes on to useContributionsInProgress, and
 * `moderationWaiting` (the two numbers at "Admin", "Meine Gruppen" MG3), which goes on to
 * useModerationWaiting. None is anything to the chat, and none fails a question (the server
 * answers them null where it cannot count), so the beat stays the chat's.
 *
 * And how far the other member of an open conversation of two has read (Chat E-093, the two
 * ticks): a thread that wants to know names the member (`watchChatRead`), the question carries
 * the members named (`readBy`), and each watcher is handed its place in the answer (`readUpTo`).
 * Nothing of it is kept here: no store, nothing on the device -- only the thread's page holds the
 * number it came with, in Apollo's cache, which the logout clears.
 *
 * Out of sight the beat rests -- except in the wallet installed as an app, whose numbers stand on
 * the app's icon (utils/appBadge, useAppBadge): there it asks once a minute while the window is
 * behind others or minimised. Nothing is marked read meanwhile: a thread marks only while the page
 * is in sight (ChatThread `markShown`).
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

/**
 * How many members one question asks the read state of -- the server's CHAT_UPDATE_READ_BY_MAX,
 * which refuses more (a drift spec holds the two together). The ones named last count: the
 * threads whose first page landed last.
 */
export const CHAT_READ_WATCH_MAX = 5

const unread = ref(0)

/**
 * How many conversations hold something unread, as the server counted them in its last answer
 * -- conversations, not messages; a muted one counts too (E-024). 0 before the first answer and
 * after the logout. Read-only outside this module.
 */
export const chatUnreadConversations = readonly(unread)

const listeners = new Set()
const editedListeners = new Set()
const reactedListeners = new Set()
/** Who wants to know how far whom has read: `{ ref, listener }`, in the order they came. */
const readWatchers = new Set()

const idle = () => ({
  /** The client the questions go through; null while the beat does not run. */
  client: null,
  /** The id the next question goes on from; null until the first answer said where one stands. */
  marker: null,
  /**
   * Where the next question goes on from for changed messages (E-060): what the last answer
   * handed on, as it came -- what it names is the server's. Null until the first answer.
   */
  editedCursor: null,
  /**
   * Where the next question goes on from for messages with changed reactions: as `editedCursor`,
   * by the server's other clock. Null until the first answer.
   */
  reactedCursor: null,
  /**
   * The changed messages the lists were asked again for, by id, with the time of the change
   * (`editedAt`): the server hands a change on again for some seconds, and the lists are asked
   * once per change, not once per answer that repeats it.
   */
  listedEdits: new Map(),
  /**
   * The transfers the member has not seen, as the last answer counted them: how many, and the
   * newest (Chat E-086) -- in one string, so that a change of either is one. Null until the first
   * answer.
   */
  transfers: null,
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
 *
 * Answers the chat's part, and the support's, the contributions' and the moderation's beside it --
 * undefined where a field is not in the answer.
 *
 * `errorPolicy: 'all'`: the other fields have authorization checks of their own on the server,
 * and an error there -- the member read anew and the database slow for that moment -- left
 * Apollo's default to throw the chat's answer away with it. Now only the chat's own part decides:
 * where it is missing, the question failed, whatever the errors say.
 */
const ask = async (afterId, editedCursor, reactedCursor, readBy) => {
  const { data } = await beat.client.query({
    query: newChatMessagesSince,
    variables: { afterId, limit: CHAT_POLL_PAGE, editedCursor, reactedCursor, readBy },
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
    context: { renewSession: false },
  })
  const update = data?.newChatMessagesSince
  if (!update) throw new Error('newChatMessagesSince: no answer')
  return {
    update,
    supportTicketsMenu: data.supportTicketsMenu,
    contributionsInProgress: data.countContributionsInProgress,
    moderationWaiting: data.moderationWaiting,
  }
}

/**
 * Hands messages on -- the arrived ones, the changed ones, or those with changed reactions. One
 * listener that fails must not stop the beat for the others.
 */
const handOn = (to, chatMessages) => {
  for (const listener of [...to]) {
    try {
      listener(chatMessages)
    } catch {
      // The listener's own business; the menu mark and the other threads go on.
    }
  }
}

/**
 * Hands each watcher the read state at its place in the answer (Chat E-093). `asked` are the
 * watchers the question named, in its order: the answer is theirs. One that went while the answer
 * was on its way gets nothing, and one that came meanwhile gets nothing of it -- the next question
 * names it. One that fails must not stop the beat for the others.
 */
const handOnRead = (asked, readUpTo) => {
  asked.forEach((watcher, place) => {
    if (!readWatchers.has(watcher)) return
    try {
      watcher.listener(readUpTo?.[place] ?? null)
    } catch {
      // The watcher's own business; the beat and the other watchers go on.
    }
  })
}

/**
 * One round of questions: the first one says where one stands (no `afterId`), every later one
 * brings what arrived since the marker -- again at once while the server says there is more, at
 * most `CHAT_POLL_ROUNDS_MAX` times.
 */
const cycle = async (mine) => {
  let arrived = false
  let moved = false
  let changed = false
  try {
    let rounds = 0
    let more = false
    do {
      // ⛔ Taken before the question leaves: the places of its answer belong to these watchers,
      // whoever comes or goes while it is on its way.
      const asked = [...readWatchers].slice(-CHAT_READ_WATCH_MAX)
      const { update, supportTicketsMenu, contributionsInProgress, moderationWaiting } = await ask(
        beat.marker,
        beat.editedCursor,
        beat.reactedCursor,
        asked.length > 0 ? asked.map(({ ref }) => ref) : null,
      )
      if (mine !== generation) return
      setSupportTicketsMenu(supportTicketsMenu)
      setContributionsInProgress(contributionsInProgress)
      setModerationWaiting(moderationWaiting)
      // The number moved without anything arriving: a conversation was read -- here, after
      // `pollChatNow`, or on another device -- and a dot in the contact list goes with it. The
      // first answer only says where one stands; the list was loaded a moment ago.
      if (beat.marker !== null && update.unreadConversations !== unread.value) moved = true
      // A transfer arrived or was seen (Chat E-086): its dot and the line under the name are the
      // list's, asked again as for a message -- also where the number of people stays the same,
      // because somebody with a message waiting sent a transfer as well.
      const transfers = `${update.unreadTransfers ?? 0}:${update.latestUnreadTransferId ?? ''}`
      if (beat.transfers !== null && transfers !== beat.transfers) moved = true
      beat.transfers = transfers
      beat.marker = update.latestId
      unread.value = update.unreadConversations
      if (update.messages.length > 0) {
        arrived = true
        handOn(listeners, update.messages)
      }
      // The changed messages (E-060), and where to go on from for them. The cursor only moves
      // with an answer that names one. A change moves no order and no dot, but the changed
      // message may be the latest of its conversation, whose words stand under a name on
      // "Kontakte & Chat" (E-083): the list is asked again for it.
      if (update.editedCursor) beat.editedCursor = update.editedCursor
      if (update.edited?.length > 0) {
        handOn(editedListeners, update.edited)
        for (const message of update.edited) {
          if (beat.listedEdits.get(message.id) === message.editedAt) continue
          beat.listedEdits.set(message.id, message.editedAt)
          changed = true
        }
      }
      // The messages whose reactions changed, the same way, with their own cursor. Nothing is
      // asked again for them either: a reaction moves no order, no dot and no number.
      if (update.reactedCursor) beat.reactedCursor = update.reactedCursor
      if (update.reacted?.length > 0) handOn(reactedListeners, update.reacted)
      handOnRead(asked, update.readUpTo)
      more = update.hasMore
      rounds += 1
    } while (more && rounds < CHAT_POLL_ROUNDS_MAX)
    beat.delay = CHAT_POLL_INTERVAL_MS
  } catch {
    if (mine !== generation) return
    beat.delay = Math.min(beat.delay * 2, CHAT_POLL_BACKOFF_MAX_MS)
  }
  // Something arrived, was read or was changed: the contact list, its order, its dots and the
  // words under its names, are the server's (E-023, E-083) -- asked again rather than kept in
  // step here.
  if ((arrived || moved || changed) && mine === generation) {
    refreshContactsPanel(beat.client)
  }
}

/**
 * The next question after the pause -- none while the beat stopped, nor while the page is out of
 * sight, unless the app's icon carries the numbers: then after a minute at the least.
 */
const schedule = () => {
  clearTimeout(beat.timer)
  beat.timer = null
  if (!beat.client) return
  let delay = beat.delay
  if (!inSight()) {
    if (!appBadgeShown()) return
    delay = Math.max(delay, APP_BADGE_HIDDEN_INTERVAL_MS)
  }
  beat.timer = setTimeout(() => {
    beat.timer = null
    poll()
  }, delay)
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

/**
 * Out of sight: the beat rests, or slows down where the app's icon carries the numbers. Back in
 * sight: a question at once, then the beat again.
 */
const onVisibility = () => {
  if (!beat.client) return
  if (!inSight()) {
    schedule()
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
  else schedule()
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
  forgetSupportTicketsMenu()
  forgetContributionsInProgress()
  forgetModerationWaiting()
  // Also where no layout ever stood in this page's life: a launch after the session ran out logs
  // out in the route guard, and the number of the last visit must not stay on the icon.
  showAppBadge(0)
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

/**
 * Hands every message whose text was changed (E-060) to `listener`, as an array per answer -- of
 * all conversations, one's own changes made elsewhere among them. Each as it stands now, to take
 * the place of the one a thread holds. Returns the function that ends it.
 *
 * ⚠️ The same change comes again with the next answers for some seconds: the server goes back a
 * little each time, so that a change committed a moment late is not passed over. Whoever says
 * something about a change says it only where the message it holds is not the same already.
 */
export const onChatMessagesEdited = (listener) => {
  editedListeners.add(listener)
  return () => {
    editedListeners.delete(listener)
  }
}

/**
 * Hands every message whose reactions were changed -- set, replaced or taken back, by anybody in
 * the conversation, one's own reactions made elsewhere among them -- to `listener`, as an array
 * per answer, of all conversations. Each as it stands now; a thread that holds one takes its
 * reactions (utils/chatReactions, withChatMessagesReacted). Returns the function that ends it.
 *
 * ⚠️ The same state comes again with the next answers for some seconds, as a changed text does,
 * and an answer can come in after a later one: `reactedAt` says which is the later state.
 */
export const onChatMessagesReacted = (listener) => {
  reactedListeners.add(listener)
  return () => {
    reactedListeners.delete(listener)
  }
}

/**
 * Tells `listener` how far the member `ref` names -- `{ gradidoID, communityUuid }` -- has read in
 * the conversation of two with the member signed in (Chat E-093), with every answer of the beat:
 * up to which message id, 0 where nothing, null where the server cannot know (a member of another
 * community). Returns the function that ends it. Asked for nobody while nobody watches.
 *
 * Only the pair goes into the question: a field the server's input type does not name would fail
 * the whole beat.
 */
export const watchChatRead = (ref, listener) => {
  const watcher = {
    ref: { gradidoID: ref.gradidoID, communityUuid: ref.communityUuid ?? null },
    listener,
  }
  readWatchers.add(watcher)
  return () => {
    readWatchers.delete(watcher)
  }
}
