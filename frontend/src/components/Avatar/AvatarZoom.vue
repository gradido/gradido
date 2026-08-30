<!-- AI-GENERATED — not an architecture reference -->
<template>
  <Teleport to="body">
    <div
      v-if="shown"
      class="avatar-zoom"
      :class="{ 'is-closing': closing }"
      role="dialog"
      aria-modal="true"
      :aria-label="shown.label || undefined"
      @click="requestClose"
    >
      <div class="avatar-zoom-backdrop" :class="{ 'is-open': grown }"></div>

      <!-- The circle itself. Position and size are inline because they are MEASURED --
           where the member tapped, and how much room this screen has -- and a stylesheet
           cannot know either. Everything that is the same on every screen stays in CSS. -->
      <div class="avatar-zoom-frame" :style="frameStyle">
        <!-- ⚠️ `key`, and it is load-bearing. Without it, opening a second face while one
             is open swaps `src` on the LIVE element -- the browser tears the old picture
             down before the new one paints, which is the blink the two-element design below
             exists to prevent. The key makes Vue replace the element instead. -->
        <img :key="memberKey" class="avatar-zoom-image" :src="shown.src" :alt="shown.label" />
        <!-- The 512 crop, laid over the small one and faded in once it has decoded. Not a
             src swap on one element, for the reason above. Two elements make the arrival a
             sharpening instead.

             `alt=""` on purpose: this is the same picture as the one underneath it, and a
             screen reader announcing the member twice for one face helps nobody. -->
        <img
          v-if="fullSource"
          :key="`${memberKey}-full`"
          class="avatar-zoom-image avatar-zoom-image-full"
          :class="{ 'is-loaded': fullLoaded }"
          :src="fullSource"
          alt=""
          @load="fullLoaded = true"
        />
      </div>

      <button
        ref="closeButton"
        type="button"
        class="avatar-zoom-close"
        :class="{ 'is-open': grown }"
        :aria-label="$t('form.close')"
        @click.stop="requestClose"
      >
        <variant-icon icon="x-circle" variant="white" />
      </button>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * One member's picture, opened from the circle that was tapped and grown to full size
 * (AS-018).
 *
 * ## Mounted once, for the whole wallet
 *
 * Driven from `useAvatarZoom`; DashboardLayout carries the single instance. A modal per
 * avatar would build one per booking row -- twenty-five escape handlers and twenty-five
 * fetches waiting for a picture that is opened at most once.
 *
 * ## Why it grows out of the circle rather than appearing
 *
 * The picture is small and somewhere in a list, and the enlarged one is centred. Cutting
 * between the two makes the member find the face again; growing it keeps the thing they
 * pointed at under their eyes the whole way. That is the whole reason the click hands up a
 * rectangle at all.
 *
 * ## It stays a CIRCLE
 *
 * ⛔ Measured, not assumed: the cropper masks its preview with a circle
 * (`AvatarCropper.vue`, `mask: radial-gradient(circle ...)`), so a member composes their
 * picture inside one. The stored square keeps the corners, but nobody framed them.
 * Un-rounding on the way up would show material its owner never looked at -- and it would
 * do so at the one size where it is visible.
 *
 * ## The origin rectangle is perishable
 *
 * It is captured once, in viewport coordinates, at the moment of the tap. There is no
 * scroll lock -- hiding the body scrollbar reflows the page by its width and moves the very
 * rectangle this animation was measured against. The consequence has to be carried rather
 * than wished away: once the page behind scrolls, the rectangle is a lie, so a scroll
 * CLOSES the overlay outright instead of animating it into somebody else's row.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useApolloClient } from '@vue/apollo-composable'
import VariantIcon from '@/components/VariantIcon.vue'
import { avatarZoomEpoch, avatarZoomState, closeAvatarZoom } from '@/composables/useAvatarZoom'
import { memberAvatarStoreEpoch, memberAvatarWithdrawn } from '@/composables/useMemberAvatars'
import { memberAvatarFull } from '@/graphql/queries'

// As close to the stored 512 as a screen usually allows, and never wider than the screen.
// 500 on a 2x display asks for 1000 real pixels from a 512 crop, which is soft and was
// weighed and accepted (AS-018) -- the alternative is a third rendition, and with it a
// migration and a re-encode of every picture that already exists.
const MAX_SIZE = 500
const VIEWPORT_SHARE = 0.86

// Long enough to read as growth, short enough not to sit between the tap and the face.
// Mirrored in the stylesheet.
const DURATION_MS = 260

// ⚠️ The teardown waits a little LONGER than the transition, not exactly as long. Vue
// applies the shrinking style in a microtask and the browser starts the transition at the
// following style flush, so the animation ends about a frame after an equal timer would
// fire. Equal values tore the overlay down at roughly 94% of the shrink -- the circle
// popped out of existence just short of the avatar instead of landing on it.
const TEARDOWN_MS = DURATION_MS + 60

// If two animation frames never arrive -- a tab hidden at the moment of the tap, a frozen
// or restored page -- `grown` would never be set, and the overlay would sit there as a
// transparent screen-covering click catcher with a 42px picture in it. This is the floor
// under that.
const GROW_FALLBACK_MS = 120

const { client } = useApolloClient()
// ⚠️ Optional, because this component is mounted in tests without a router. `useRoute`
// injects, so outside a router context it is simply undefined -- and reading `.path` off
// that is a crash at mount, not a missing feature.
const route = useRoute()

const shown = ref(null)
const grown = ref(false)
const fullSource = ref('')
const fullLoaded = ref(false)
const viewport = ref({ width: 0, height: 0 })
const closeButton = ref(null)

// What was focused before, so it can be handed back. A member who opened a face with the
// keyboard should land on the same circle again, not at the top of the document.
let returnFocusTo = null
// ⚠️ A `ref`, not a plain `let`, and that is not tidiness: `closing` below is a computed
// over it, and a computed over an ordinary variable never re-evaluates -- the class would
// simply never reach the template. Written as a plain let first, and the test that asserts
// the shrinking overlay stops swallowing clicks is what caught it.
//
// Non-null exactly while the overlay is shrinking, so it doubles as the "a close is already
// under way" flag and there is no second boolean to keep in step with it.
const closeTimer = ref(null)
let growTimer = null
let growFrame = 0
// Where the page stood when the picture was measured. A scroll away from it makes the
// origin rectangle a lie.
let openedAtScroll = 0

const closing = computed(() => Boolean(closeTimer.value))

// Identifies the face on screen, so the two <img> elements can be keyed on it.
const memberKey = computed(() =>
  shown.value ? `${shown.value.member.communityUuid ?? ''}/${shown.value.member.gradidoID}` : '',
)

const finalSize = computed(() =>
  Math.min(
    MAX_SIZE,
    Math.round(viewport.value.width * VIEWPORT_SHARE),
    Math.round(viewport.value.height * VIEWPORT_SHARE),
  ),
)

// Two states, one style: the rectangle that was tapped, and the centred square. The
// transition between them lives in CSS, so nothing here has to animate anything.
const frameStyle = computed(() => {
  if (!shown.value) return {}
  if (!grown.value) {
    const { top, left, width, height } = shown.value.origin
    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
    }
  }
  const size = finalSize.value
  return {
    top: `${Math.max(0, (viewport.value.height - size) / 2)}px`,
    left: `${Math.max(0, (viewport.value.width - size) / 2)}px`,
    width: `${size}px`,
    height: `${size}px`,
  }
})

// ⚠️ Assigns only on a real change. `innerWidth`/`innerHeight` flush layout, and a fresh
// object every time would invalidate `frameStyle` -- whose four properties are the ones
// carrying the transition -- so an unthrottled resize drag restarted the growth animation
// on every event and the circle rubber-banded behind the drag.
const readViewport = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  if (viewport.value.width === width && viewport.value.height === height) return
  viewport.value = { width, height }
}

/**
 * Fetches the 512 crop for the member being shown.
 *
 * `no-cache`, and that is the strict reading of AS-018 rather than a performance choice:
 * a face may be withdrawn, and a copy sitting in the Apollo store would outlive the
 * withdrawal for as long as the tab is open. Nothing is kept, so nothing has to be
 * invalidated -- and 55 KB on a gesture that already implies waiting is not a cost worth
 * a cache that has to be got right.
 *
 * ⛔ TWO counters are read before the request and compared after it, and they answer
 * different questions. `avatarZoomEpoch` says "is this still the face that was asked
 * about"; `memberAvatarStoreEpoch` says "is this still the same SESSION". Both live at
 * MODULE level, and that is the point -- a logout unmounts this component, so a counter in
 * `setup()` would be frozen at exactly the moment it matters and its guard would pass by
 * definition. Same reasoning, and the same second counter, as `collectMemberAvatars` in
 * DashboardLayout.
 *
 * A null answer -- withdrawn between the list and the tap, or never allowed -- is not an
 * error and shows nothing: the small picture that is already on screen stays. Same for a
 * failed request; a member looking at a face does not need to hear about the network.
 *
 * ⚠️ "Silent" is only true of THIS component. A schema mismatch (a wallet deployed ahead of
 * its backend) is caught by Apollo's `outdatedLink` before it ever reaches here and raises
 * the app-outdated bar for the rest of the session -- advice that cannot help, because the
 * member's bundle is already the current one. That is a property of the link chain and no
 * catch here can undo it; it is written down so the next reader does not take the quiet
 * catch for a guarantee.
 */
const fetchFull = async (member) => {
  const zoomEpoch = avatarZoomEpoch()
  const storeEpoch = memberAvatarStoreEpoch()
  try {
    const { data } = await client.query({
      query: memberAvatarFull,
      variables: { ref: { gradidoID: member.gradidoID, communityUuid: member.communityUuid } },
      fetchPolicy: 'no-cache',
    })
    if (zoomEpoch !== avatarZoomEpoch() || storeEpoch !== memberAvatarStoreEpoch()) return
    if (!data?.memberAvatarFull) return
    fullSource.value = `data:image/jpeg;base64,${data.memberAvatarFull}`
  } catch {
    // Nothing to say and nothing to do: the small rendition is already showing the face.
  }
}

const clearTimers = () => {
  if (closeTimer.value) clearTimeout(closeTimer.value)
  if (growTimer) clearTimeout(growTimer)
  if (growFrame) cancelAnimationFrame(growFrame)
  closeTimer.value = null
  growTimer = null
  growFrame = 0
}

const overlayContains = (node) => Boolean(closeButton.value?.parentElement?.contains(node))

const grow = (value) => {
  if (shown.value !== value || closing.value) return
  grown.value = true
}

const open = (value) => {
  clearTimers()
  // ⚠️ Only when nothing is open. A second open landing during a shrink would otherwise
  // capture a node INSIDE the overlay -- the close button takes focus when it is clicked --
  // and the eventual restore would aim at an element the close has since removed.
  if (!shown.value) returnFocusTo = document.activeElement
  readViewport()
  openedAtScroll = window.scrollY
  fullSource.value = ''
  fullLoaded.value = false
  shown.value = value
  grown.value = false

  // Two frames, not one. Vue paints the element with its starting rectangle in the first;
  // changing the style inside that same frame would let the browser collapse both values
  // into one initial state, and there would be no growth at all -- just the finished
  // picture, appearing. The timer underneath is the floor for when frames never come.
  growFrame = requestAnimationFrame(() => {
    growFrame = requestAnimationFrame(() => grow(value))
  })
  growTimer = setTimeout(() => grow(value), GROW_FALLBACK_MS)

  // The dialog takes focus, which is what `aria-modal` promises. Without it the avatar
  // button underneath stays focused: assistive tech is told the page is hidden while the
  // cursor sits in the hidden part, Tab walks the covered page, and a second Enter on that
  // still-live button re-opened the overlay and paid for the picture a second time.
  requestAnimationFrame(() => closeButton.value?.focus?.())

  fetchFull(value.member)
}

// Hands focus back, but only where that is an improvement. A node the router has since
// removed cannot take it -- the browser drops focus to <body> instead, which is worse than
// leaving it alone -- and a member who has already moved on should not have it yanked back
// to a sidebar avatar a quarter of a second later.
const restoreFocus = () => {
  const target = returnFocusTo
  returnFocusTo = null
  if (!target?.focus || !target.isConnected) return
  const active = document.activeElement
  if (active && active !== document.body && !overlayContains(active)) return
  target.focus()
}

const finishClose = () => {
  clearTimers()
  shown.value = null
  grown.value = false
  fullSource.value = ''
  fullLoaded.value = false
  // ⚠️ AFTER the local state is cleared. This wakes the watcher below, whose null branch
  // would otherwise re-enter this function.
  closeAvatarZoom()
  restoreFocus()
}

/**
 * Shrinks back into the circle it came from, then lets go.
 *
 * ⛔ The shared state is NOT cleared here. It used to be, and that quietly took the Escape
 * and resize handlers with it -- the watcher's null branch removes them -- so for the whole
 * shrink the overlay was still full-screen and click-blocking with no way out but waiting.
 *
 * `immediate` skips the shrink altogether, for the cases where the rectangle it would
 * shrink into is no longer true: the page scrolled, the route changed, or the picture was
 * withdrawn while somebody was looking at it.
 */
const requestClose = ({ immediate = false } = {}) => {
  if (!shown.value || closing.value) return
  if (immediate) {
    finishClose()
    return
  }
  grown.value = false
  closeTimer.value = setTimeout(finishClose, TEARDOWN_MS)
}

const onKeydown = (event) => {
  if (event.key === 'Escape') {
    requestClose()
    return
  }
  // ⛔ `aria-modal` is a CLAIM, not a mechanism: it tells assistive tech the rest of the
  // page is not there, and does nothing at all to stop Tab reaching it. Without this the
  // member is told the wallet behind is hidden and can then tab into it and activate
  // controls they cannot see.
  //
  // The overlay holds exactly one focusable thing, so the trap is the whole cycle: keep Tab
  // on the close button. Written as "put it back" rather than as a list of focusable
  // elements, because a list would go stale the day something else is added here -- and the
  // stale version fails open, into the page this is supposed to shut off.
  if (event.key === 'Tab' && shown.value) {
    event.preventDefault()
    closeButton.value?.focus?.()
  }
}

// The origin rectangle is in viewport coordinates and is never re-measured, so once the
// page behind has moved, shrinking into it would land on empty space or on a different
// member's row. Closing outright is the honest answer.
const onScroll = () => {
  if (shown.value && window.scrollY !== openedAtScroll) requestClose({ immediate: true })
}

const addListeners = () => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', readViewport)
  window.addEventListener('scroll', onScroll, { passive: true })
}

const removeListeners = () => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', readViewport)
  window.removeEventListener('scroll', onScroll)
}

watch(avatarZoomState, (value) => {
  if (value) {
    open(value)
    addListeners()
    return
  }
  removeListeners()
  // Cleared from somewhere else -- a logout, or any caller that is not requestClose. There
  // is nothing to shrink back into by then, so it goes at once. A close started HERE does
  // not reach this branch: requestClose leaves the shared state alone until finishClose.
  if (shown.value) finishClose()
})

// The one way out that is neither a tap nor Escape: the browser's back button. The overlay
// covers the screen, so nothing inside it can navigate -- but the page underneath can
// change without it, and a face left hanging over a different page belongs to nobody. The
// rectangle it grew out of goes with that page, so this one does not shrink either.
watch(
  () => route?.path,
  () => {
    if (shown.value) requestClose({ immediate: true })
  },
)

// The withdrawal has to reach a picture that is already open, not only the ones lying in
// storage. A member who switches their picture off while somebody is looking at it would
// otherwise stay on that screen until the viewer happened to tap it away.
watch(
  () => Boolean(shown.value) && memberAvatarWithdrawn(shown.value.member),
  (withdrawn) => {
    if (withdrawn) requestClose({ immediate: true })
  },
)

onBeforeUnmount(() => {
  removeListeners()
  clearTimers()
  // ⛔ The shared state is module-level and outlives this component, so an unmount with a
  // face open -- the idle-timeout logout is the realistic one, it fires precisely when
  // somebody is sitting still and looking -- would leave another member's picture and id
  // in memory for the life of the tab.
  //
  // ⚠️ Unconditionally, NOT `if (shown.value)`. The watcher is not `immediate` and flushes
  // before render, so between `openAvatarZoom` and this component noticing there is a
  // window in which the shared state holds a face while `shown` is still null. An unmount
  // landing in that window -- and a logout is exactly what unmounts this -- would read the
  // local state, find nothing, and leave the picture behind. `closeAvatarZoom` on an
  // already-empty state costs one assignment.
  closeAvatarZoom()
})
</script>

<style lang="scss">
/* Comments here must be block comments: lightningcss parses SFC style blocks, and a
   double slash is not a comment to it -- the build dies with "Invalid empty selector". */
.avatar-zoom {
  position: fixed;
  inset: 0;

  /* Above the navbar and the sidebar, below nothing else in the wallet. */
  z-index: 2000;
  cursor: zoom-out;
}

/* While it is shrinking the overlay is still on screen and still full-size, so without
   this it goes on swallowing every click for a quarter of a second after the member has
   already decided to close it -- and their next tap, on a booking row or a second face,
   does nothing at all. */
.avatar-zoom.is-closing {
  pointer-events: none;
}

.avatar-zoom-backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 62%);
  opacity: 0;
  transition: opacity 260ms ease;
}

.avatar-zoom-backdrop.is-open {
  opacity: 1;
}

/* The growing circle. `position: fixed` and viewport coordinates, so it starts exactly
   where getBoundingClientRect() said the small one was. */
.avatar-zoom-frame {
  position: fixed;
  overflow: hidden;
  border-radius: 50%;
  background: rgb(0 0 0 / 20%);
  box-shadow: 0 18px 48px rgb(0 0 0 / 45%);
  transition-property: top, left, width, height;
  transition-duration: 260ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.avatar-zoom-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-zoom-image-full {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 180ms ease;
}

.avatar-zoom-image-full.is-loaded {
  opacity: 1;
}

/* 44 points because that is a finger, not because the icon needs it -- the ring the icon
   draws is smaller, and the rest is tap target.

   ⚠️ `visibility`, not `opacity` alone. An opacity-0 button is still focusable and still
   clickable, so before the growth and throughout the shrink a keyboard member could land
   on an invisible control in an overlay that is already dying. */
.avatar-zoom-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 260ms ease,
    visibility 0s linear 260ms;
  appearance: none;
}

.avatar-zoom-close.is-open {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 260ms ease,
    visibility 0s;
}

.avatar-zoom-close .icon-variant {
  width: 28px;
  height: 28px;
}

.avatar-zoom-close:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

/* Somebody who asked their system for less motion gets the picture, not the journey. The
   sizes and positions still apply -- only the travel between them stops. */
@media (prefers-reduced-motion: reduce) {
  .avatar-zoom-frame,
  .avatar-zoom-backdrop,
  .avatar-zoom-close,
  .avatar-zoom-image-full {
    transition: none;
  }
}
</style>
