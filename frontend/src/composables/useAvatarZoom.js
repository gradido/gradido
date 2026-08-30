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

import { computed, ref } from 'vue'

// null while nothing is open. Holds the member being shown, the picture already on the
// device (the small one, so something appears instantly), and the rectangle the member
// tapped -- which is what the zoom grows out of.
const state = ref(null)

export const avatarZoomState = computed(() => state.value)

/**
 * Opens the full view of one member's picture.
 *
 * @param {object} options
 * @param {{gradidoID: string, communityUuid?: string|null}} options.member who to show
 * @param {string} options.src the small rendition already held, as an <img> source
 * @param {DOMRect|{top,left,width,height}} options.origin where the picture is right now
 * @param {string} [options.label] what to call this member out loud, for screen readers
 */
export const openAvatarZoom = ({ member, src, origin, label = '' }) => {
  // ⛔ Both halves are required, and neither is a formality. Without `src` there is no
  // picture on this device, so there is nothing to grow -- the member has letters, and a
  // zoom of letters is not a thing anybody asked for. Without `origin` the animation has
  // no starting rectangle and the overlay would appear from nowhere, which is the one
  // behaviour this feature exists to avoid.
  if (!member?.gradidoID || !src || !origin) return

  state.value = {
    member: { gradidoID: member.gradidoID, communityUuid: member.communityUuid ?? null },
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
 * @param {{gradidoID?: string, communityUuid?: string|null}|null} member
 * @param {{src?: string}} avatarProps what memberAvatarProps worked out for this member
 * @param {string} label
 */
export const avatarZoomBindings = (member, avatarProps, label = '') => {
  if (!member?.gradidoID || !avatarProps?.src) return {}
  return {
    zoomable: true,
    // ★ The SAME string in both places, from one argument. The button announces it before
    // the picture opens and the overlay carries it while it is open; taking them from two
    // call-site expressions is how they come to name different things.
    zoomLabel: label,
    onZoom: (origin) => openAvatarZoom({ member, src: avatarProps.src, origin, label }),
  }
}
