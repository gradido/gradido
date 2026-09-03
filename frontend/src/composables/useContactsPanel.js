// AI-GENERATED — not an architecture reference

import { reactive } from 'vue'
import { contactListQuery } from '@/graphql/contacts.graphql'
import { CONTACTS_PANEL_PAGE_SIZE } from '@/constants'

/**
 * The contacts the right-hand column and the phone strip draw from -- one request for the
 * whole app.
 *
 * ⛔ Module state rather than a query inside the component: the two postures are one panel
 * and must not be able to disagree about who somebody is, and the list has to outlive a
 * flick of the switch and a walk between the three routes it stands beside.
 *
 * ⛔ And NOT read out of the layout's one booking query. The contacts are a grouping over
 * bookings made on the server, each person once; deriving them here from a page of twelve
 * bookings would name whoever happened to be on that page.
 *
 * ★ TWO slots. `page` is the newest contacts, never filtered; `matches` is what came back
 * for the word typed in the column's search box. They are kept apart because the strip has
 * no search box: with one slot, a word typed on a wide screen left the strip silently
 * showing a filtered handful after a rotation, with nothing on screen to say why.
 *
 * ★ And each slot answers three questions, not one flag:
 *   - `loaded` / `failed` -- is there something to show, or something to say?
 *   - `wanted` vs `served` -- has a FRESHER answer been asked for than the one held?
 * The second pair is what makes a refresh impossible to lose. A counter of mounted panels
 * decided that before, and a transfer made while the column stood on bookings was dropped
 * on the floor: nothing was mounted, so nothing fetched, and the short-circuit below then
 * refused to fetch ever again.
 */
const emptySlot = () => ({ rows: [], count: 0, loaded: false, failed: false, wanted: 0, served: 0 })

const state = reactive({
  /** The newest contacts, and how many PEOPLE there are -- not how many bookings. */
  page: emptySlot(),
  /** What is typed in the column's search box; '' means nothing is being searched. */
  search: '',
  /** What the server answered for that word. `count` here is the number of MATCHES. */
  matches: emptySlot(),
})

export const contactsPanelState = state

/** Whether a slot holds an answer that is both present and current. */
const needsLoad = (slot) => !slot.loaded || slot.failed || slot.served !== slot.wanted

/**
 * How many panels are on screen. Used for ONE decision only: whether a refresh fetches now
 * or leaves the slot marked for the next mount. It is never allowed to decide that a
 * refresh does not happen at all.
 */
let watching = 0

export const holdContactsPanel = () => {
  watching += 1
}

export const releaseContactsPanel = () => {
  watching = Math.max(0, watching - 1)
}

/**
 * Which request each slot belongs to.
 *
 * ⛔ ONE guard for four different ways an answer can become irrelevant, where there used to
 * be two guards covering two of them: the member signed out, a newer word was typed, a
 * refresh overtook this request, or the slot itself was replaced when the search was
 * cleared. All four end the same way -- somebody else owns the slot now -- so all four are
 * this comparison, and none of them can be forgotten separately.
 */
const owner = { page: null, matches: null }
const inFlight = { page: null, matches: null }

const load = (apolloClient, slotName, search) => {
  const token = {}
  owner[slotName] = token
  const slot = state[slotName]
  const at = slot.wanted

  const handle = apolloClient
    .query({
      query: contactListQuery,
      variables: {
        currentPage: 1,
        pageSize: CONTACTS_PANEL_PAGE_SIZE,
        search: search || null,
      },
      // ⛔ `no-cache`, not `network-only`. Both skip the cache on the way IN; only
      // network-only also writes the answer BACK, and nothing ever reads it: every reader
      // of contactList asks the network, the rows carry no id to normalise on, so each
      // distinct search word would leave its own copy in the store until logout. The same
      // distinction is measured and written down in useMemberAvatars.
      fetchPolicy: 'no-cache',
    })
    .then(({ data }) => {
      if (owner[slotName] !== token) return
      slot.rows = data?.contactList?.contacts ?? []
      slot.count = data?.contactList?.count ?? 0
      slot.loaded = true
      slot.failed = false
      // What was asked for when this request left. A refresh during the round trip raised
      // `wanted` again, so this answer is already behind and the slot stays due.
      slot.served = at
    })
    .catch(() => {
      if (owner[slotName] !== token) return
      slot.loaded = true
      slot.served = at
      // ⛔ Only where there is nothing to show. A failed BACKGROUND refresh used to replace
      // a working list of five people with "not reachable", and nothing retried -- the
      // member had to flick the switch away and back to get back a list they already had.
      slot.failed = slot.rows.length === 0
    })
    .finally(() => {
      if (inFlight[slotName] === handle) {
        inFlight[slotName] = null
      }
    })

  inFlight[slotName] = handle
  return handle
}

/** Waits for a request already on its way rather than asking twice. */
const loadOnce = (apolloClient, slotName, search) =>
  inFlight[slotName] ?? load(apolloClient, slotName, search)

/**
 * Asks for whatever is missing or out of date -- the newest contacts, and the matches for a
 * word that is still standing in the box.
 *
 * ⛔ The search half is not an afterthought: a search whose request failed used to be
 * unrecoverable, because the only retry was the box changing and the box already held the
 * word. Flicking the switch away and back -- the gesture members actually make -- remounts
 * this and now asks again.
 */
export const ensureContactsPanel = (apolloClient) => {
  const jobs = []
  if (needsLoad(state.page)) {
    jobs.push(loadOnce(apolloClient, 'page', ''))
  }
  if (state.search !== '' && needsLoad(state.matches)) {
    jobs.push(loadOnce(apolloClient, 'matches', state.search))
  }
  return Promise.all(jobs)
}

/**
 * A word was typed in the column. The server does the searching, because the panel holds
 * twenty rows and searching those twenty would answer about the wrong set -- the whole
 * contact list is what somebody is looking through.
 *
 * An empty word is not a search: the slot is cleared and the column falls back to the page
 * it already has, without a request.
 */
export const searchContactsPanel = (apolloClient, search) => {
  const text = search ?? ''
  const unchanged = text === state.search
  state.search = text

  if (text === '') {
    // The owner travels with the slot: releasing it here says that nothing owns `matches`
    // any more, which is what the fresh object below means.
    //
    // ⚠️ Defensive, and measured to be so -- removing this line fails no test, because the
    // slot object is replaced in the same breath and a settling request would write into
    // the one nothing references. It stays because the invariant is "a slot and its owner
    // move together", and the day the reset becomes an in-place one this is the line that
    // keeps a stale answer out of the visible slot.
    owner.matches = null
    inFlight.matches = null
    state.matches = emptySlot()
    return Promise.resolve()
  }

  if (unchanged) {
    return needsLoad(state.matches) ? loadOnce(apolloClient, 'matches', text) : Promise.resolve()
  }
  return load(apolloClient, 'matches', text)
}

/**
 * The contact list may have gained somebody -- called where the layout learns that a
 * transfer went through.
 *
 * ⛔ Marks first, fetches second, and the mark is what makes this impossible to lose. With
 * no panel on screen there is nothing to fetch FOR, but the slot is now due, so the next
 * mount asks. The version that only counted mounted panels dropped the refresh entirely,
 * and the short-circuit in `ensureContactsPanel` then refused to look again for the rest of
 * the session -- a member who paid somebody new while the column stood on bookings never
 * saw them in it.
 */
export const refreshContactsPanel = (apolloClient) => {
  // ⛔ The mark comes FIRST, before any reason not to fetch. Standing behind a
  // `!state.page.loaded` gate lost the very case this exists for: a member completes a
  // transfer while the first request is still on the wire -- a first visit to /send with the
  // column up -- and that request left BEFORE the transfer, so its answer cannot carry the
  // new counterparty. Without the mark it lands as `served === wanted`, `needsLoad` turns
  // false, and nothing asks again for the rest of the session. Which is exactly the failure
  // the paragraph above called impossible. (coderabbit, PR #3836.)
  state.page.wanted += 1
  if (state.search !== '') {
    state.matches.wanted += 1
  }
  // Nothing to fetch FOR: the mark above is what makes the next mount ask.
  if (watching === 0) {
    return Promise.resolve()
  }
  // ⛔ A fresh request, never the one already on the wire: that one left before the event
  // this refresh is about. The owner token makes the older answer harmless when it lands.
  const jobs = [load(apolloClient, 'page', '')]
  if (state.search !== '') {
    jobs.push(load(apolloClient, 'matches', state.search))
  }
  return Promise.all(jobs)
}

/** On logout: the next member on this device must not see the previous one's contacts. */
export const forgetContactsPanel = () => {
  owner.page = null
  owner.matches = null
  inFlight.page = null
  inFlight.matches = null
  state.page = emptySlot()
  state.matches = emptySlot()
  state.search = ''
  watching = 0
}
