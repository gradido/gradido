// AI-GENERATED — not an architecture reference
import { computed, shallowReactive, shallowRef } from 'vue'
import { chatMessageImage } from '@/graphql/chat.graphql'

// The pictures of chat messages (P7), fetched when their bubble comes into sight and kept for the
// rest of the session -- by the picture's uuid, as an address the <img> can show
// (`URL.createObjectURL`).
//
// ⛔ In MEMORY only, never in localStorage (E-041, point 5): 5 MB of browser storage hold only a
// handful of pictures, and Dario's objection to a hand-made browser cache (Avatar-Sichtbarkeit,
// Notiz 18.09.) holds here all the more -- the cache with a cache header belongs to Gradido 2. So a
// reload asks again, and whatever was fetched goes with the tab. A thousand pictures of 32 KB are
// 32 MB; they are let go at logout (forgetAllChatImages) or with the tab.
//
// ⛔ No base64 in Apollo's cache either: `chatMessageImage` is asked `no-cache`, and its answer is
// turned into bytes at once. The cache would keep every picture as some 44,000 characters for the
// life of the tab, on top of this store.
//
// Not in the vuex store, for the reason useMemberAvatars gives: that store is written whole into
// localStorage on every mutation.

/**
 * How many pictures are asked for at once. The server serves ten per HTTP request (it counts by
 * request, and every query here is a request of its own -- no batching, apolloProvider.js), so
 * three is not the server's bound but the phone's: a thread that opens with twenty pictures in
 * sight fetches them three by three instead of twenty at once over one weak line.
 */
export const CHAT_IMAGES_AT_ONCE = 3

/** uuid -> { state: 'loading' | 'ready' | 'missing' | 'failed', src }. Shallow: an entry is replaced whole. */
const pictures = shallowReactive(new Map())
/** Asked for and not yet on its way: `{ key, imageUuid, client }`, first come, first served. */
let waiting = []
/** On their way now, for this session: an answer of the one before does not hold up the next. */
let running = 0

/**
 * Bumped when everything is let go. An answer asked for before belongs to nobody: it may not be
 * put back into the store of the next member on this browser.
 */
let epoch = 0

const keyOf = (imageUuid) => String(imageUuid ?? '').toLowerCase()

/** The bytes of a JPEG in base64, as an address an <img> can show. */
const addressOf = (base64) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }))
}

/**
 * What is known about a picture: `{ state, src }` -- `src` only where the state is 'ready' -- or
 * null where nobody has asked for it yet. Reactive: a bubble that reads it here is drawn anew when
 * the picture comes.
 */
export const chatImage = (imageUuid) => pictures.get(keyOf(imageUuid)) ?? null

const fetchOne = async ({ key, imageUuid, client }, askedIn) => {
  let entry
  try {
    const { data } = await client.query({
      query: chatMessageImage,
      variables: { imageUuid },
      fetchPolicy: 'no-cache',
    })
    const base64 = data?.chatMessageImage ?? null
    // Null is the server's answer for "not for you, not there, not any more", without a reason.
    entry = base64 ? { state: 'ready', src: addressOf(base64) } : { state: 'missing', src: null }
  } catch {
    // The line, not the picture: asked again the next time its bubble is drawn.
    entry = { state: 'failed', src: null }
  }
  if (askedIn !== epoch) {
    if (entry.src) URL.revokeObjectURL(entry.src)
    return
  }
  pictures.set(key, entry)
}

const pump = () => {
  while (running < CHAT_IMAGES_AT_ONCE && waiting.length > 0) {
    const job = waiting.shift()
    const askedIn = epoch
    running += 1
    fetchOne(job, askedIn).finally(() => {
      if (askedIn !== epoch) return
      running -= 1
      pump()
    })
  }
}

/**
 * Asks for a picture, unless it is here or on its way already: in line behind the ones asked for
 * before, at most CHAT_IMAGES_AT_ONCE at a time. One that failed (the line, not the picture) is
 * asked for again; one the server said nothing about stays "missing".
 *
 * `client`: the Apollo client, from the asking component's setup (`useApolloClient`).
 */
export const requestChatImage = (client, imageUuid) => {
  const key = keyOf(imageUuid)
  if (!key) return
  const known = pictures.get(key)
  if (known && known.state !== 'failed') return
  pictures.set(key, { state: 'loading', src: null })
  waiting.push({ key, imageUuid, client })
  pump()
}

/**
 * One's own picture, just sent: kept from the JPEG the wallet made (utils/chatImage), under the
 * uuid the server filed it by -- its bubble shows it without asking the server for what came from
 * here a moment ago.
 */
export const rememberChatImage = (imageUuid, base64) => {
  const key = keyOf(imageUuid)
  if (!key || !base64) return
  const known = pictures.get(key)
  if (known?.src) URL.revokeObjectURL(known.src)
  pictures.set(key, { state: 'ready', src: addressOf(base64) })
}

/**
 * The picture open large (ChatImageView), or null: `{ imageUuid, width, height, who, name, at,
 * caption, opener }` -- who sent it as the view names them (`who`, "Du" for one's own) and as its
 * title names them (`name`), when it arrived, its caption, and the button in the bubble that
 * opened it, which gets the focus back.
 *
 * At module level, as useAvatarZoom keeps its face: the logout closes it wherever it is.
 */
const viewed = shallowRef(null)
export const chatImageViewState = computed(() => viewed.value)

export const openChatImageView = (view) => {
  viewed.value = view
}

export const closeChatImageView = () => {
  viewed.value = null
}

/**
 * Lets every picture go -- at logout, beside forgetAllMemberAvatars and for the same reason: the
 * next member to sign in on this browser must not be handed the pictures of the conversations of
 * the one before. The addresses are given back to the browser, the ones in line are not asked for,
 * and an answer still on its way is dropped when it lands (`epoch`) -- nor does it count against
 * the three the next member may have on their way.
 */
export const forgetAllChatImages = () => {
  epoch += 1
  waiting = []
  running = 0
  for (const entry of pictures.values()) {
    if (entry.src) URL.revokeObjectURL(entry.src)
  }
  pictures.clear()
}
