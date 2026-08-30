// AI-GENERATED — not an architecture reference

// Which face is currently open at full size, and where on screen it was tapped (AS-018).
//
// ⛔ State only. No Apollo here, deliberately: `useApolloClient` may only be called from a
// setup scope, and this module is imported by list rows that call `openAvatarZoom` from a
// click handler. Putting the fetch here would work until the first caller that is not a
// component, and then fail at runtime with nothing red beforehand. The one component that
// renders the overlay does the fetching, in its own setup.
//
// ★ One overlay for the whole wallet, mounted once in DashboardLayout, driven from here.
// The alternative -- a modal per avatar -- would build twenty-five of them for a booking
// list that shows one at most, and each would carry its own fetch and its own escape key.
//
// What is kept is only ever the picture being LOOKED AT: opened on a click, dropped on
// close. Nothing accumulates across a session, which matters for a rendition that weighs
// about ten times the everyday one -- and it means a face whose owner withdraws it is not
// still lying in memory afterwards. Re-opening the same member costs one request, on a
// gesture that already implies waiting.
//
// ⚠️ "Dropped on close" is only true because `closeAvatarZoom` is also called from the
// LOGOUT action and from the overlay's unmount hook. Neither was there at first: the module
// outlives every component, so a session that ended with a face open used to leave that
// face here for the life of the tab. See store.js, next to `forgetAllMemberAvatars`.

import { computed, ref } from 'vue'
import i18n from '@/i18n'
import { memberAlias } from '@/utils/gradidoAddress'

// null while nothing is open. Holds the member being shown, the picture already on the
// device (the small one, so something appears instantly), and the rectangle the member
// tapped -- which is what the zoom grows out of.
const state = ref(null)

/**
 * Bumped by every open AND every close, so an answer that was asked for under one of them
 * can be recognised as belonging to a moment that has passed.
 *
 * ⛔ At MODULE level, not in the overlay's `setup()`. That is not a preference: this repo
 * already made the mistake and wrote it down (DashboardLayout.vue, `collectMemberAvatars`)
 * -- "a counter in `setup()` is one per layout instance, while the pictures are one per
 * module, so the instance that a logout destroys keeps a counter nobody can ever bump
 * again, and its guard passes by definition." A logout unmounts the overlay; an instance
 * counter would be frozen exactly when it matters most.
 */
let epoch = 0
export const avatarZoomEpoch = () => epoch

export const avatarZoomState = computed(() => state.value)

/**
 * The member's word, or nothing.
 *
 * `memberAlias` falls back to the gradidoID for an alias under three characters -- a real
 * state for the legacy one- and two-character usernames. On the row that is fine, because
 * the same fallback is printed right there. Read out by a screen reader it is a uuid, so
 * here "no usable word" is an answer and the label loses the name rather than gaining an
 * identifier.
 */
const spokenName = (member) => {
  const alias = memberAlias(member?.alias, member?.gradidoID)
  return alias && alias !== member?.gradidoID ? alias : ''
}

/**
 * What the button says, and what the opened picture is called. Two strings, because they
 * do two different jobs: the button carries a COMMAND ("enlarge this"), the dialog and the
 * image carry a DESCRIPTION ("this is X's picture"). Reusing one for both makes a screen
 * reader offer to do the thing it has just done, three times over.
 *
 * ⛔ Built HERE and not at the call sites. Both places that show another member's face
 * assembled this themselves until a review pointed out that the helper already holds the
 * member -- and that the split is exactly what the helper exists to prevent.
 *
 * `i18n.global.t` rather than `useI18n()`, because this is not a setup scope. That is the
 * established way out of a composable in this repo (store.js, filters/amount.js).
 */
const zoomLabels = (member) => {
  const name = spokenName(member)
  const t = i18n.global.t
  return {
    button: name ? t('avatar.zoom-open', { name }) : t('avatar.zoom-open-plain'),
    picture: name ? t('avatar.zoom-picture', { name }) : t('avatar.zoom-picture-plain'),
  }
}

/**
 * Opens the full view of one member's picture.
 *
 * @param {object} options
 * @param {{gradidoID: string, communityUuid?: string|null}} options.member who to show
 * @param {string} options.src the small rendition already held, as an <img> source
 * @param {DOMRect|{top,left,width,height}} options.origin where the picture is right now
 * @param {string} [options.label] what to call the opened picture, for screen readers
 */
export const openAvatarZoom = ({ member, src, origin, label = '' }) => {
  // ⛔ Both halves are required, and neither is a formality. Without `src` there is no
  // picture on this device, so there is nothing to grow -- the member has letters, and a
  // zoom of letters is not a thing anybody asked for. Without `origin` the animation has
  // no starting rectangle and the overlay would appear from nowhere, which is the one
  // behaviour this feature exists to avoid.
  if (!member?.gradidoID || !src || !origin) return

  const communityUuid = member.communityUuid ?? null

  // ⚠️ Already showing this face: do nothing at all, rather than re-open it. The overlay
  // does not take focus away from the avatar it grew out of, so a keyboard member's second
  // Enter arrives here -- and a re-open resets the animation, throws away the 512 crop that
  // has already decoded, and pays for it a second time.
  if (
    state.value &&
    state.value.member.gradidoID === member.gradidoID &&
    state.value.member.communityUuid === communityUuid
  ) {
    return
  }

  epoch++
  state.value = {
    member: { gradidoID: member.gradidoID, communityUuid },
    src,
    label,
    origin: {
      top: origin.top,
      left: origin.left,
      width: origin.width,
      height: origin.height,
    },
  }
}

export const closeAvatarZoom = () => {
  // Bumped on the way out too, so an answer still in flight belongs to nobody. A counter
  // that only counts openings cannot tell "closed" from "never opened".
  epoch++
  state.value = null
}

/**
 * Everything AppAvatar needs in order to BE clickable, or nothing at all.
 *
 * ★ Returns an empty object when there is no picture, and that is the point of having it:
 * `v-bind` of {} leaves the avatar exactly as it was. So a call site does not have to
 * decide whether this member is zoomable -- it binds this, and members without a picture
 * keep the plain, unclickable circle they always had. The alternative is a `v-if` in every
 * template, which is where the answer eventually comes to differ between them.
 *
 * @param {{gradidoID?: string, alias?: string, communityUuid?: string|null}|null} member
 * @param {{src?: string}} avatarProps what memberAvatarProps worked out for this member
 */
export const avatarZoomBindings = (member, avatarProps) => {
  if (!member?.gradidoID || !avatarProps?.src) return {}
  const labels = zoomLabels(member)
  return {
    zoomable: true,
    zoomLabel: labels.button,
    onZoom: (origin) =>
      openAvatarZoom({ member, src: avatarProps.src, origin, label: labels.picture }),
  }
}
