<!-- AI-GENERATED — not an architecture reference -->
<template>
  <Teleport to="body">
    <div
      v-if="shown"
      class="avatar-zoom"
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
        <img class="avatar-zoom-image" :src="shown.src" :alt="shown.label" />
        <!-- The 512 crop, laid over the small one and faded in once it has decoded. Not a
             src swap on one element: the browser tears the old picture down before the new
             one paints, so the face would blink out at the exact moment the member is
             looking at it. Two elements make the arrival a sharpening instead. -->
        <img
          v-if="fullSource"
          class="avatar-zoom-image avatar-zoom-image-full"
          :class="{ 'is-loaded': fullLoaded }"
          :src="fullSource"
          :alt="shown.label"
          @load="fullLoaded = true"
        />
      </div>

      <button
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
 * ## No scroll lock
 *
 * ⚠️ Deliberate. Hiding the body's scrollbar reflows the page by its width, which moves
 * the very rectangle this animation was measured against -- the picture would jump before
 * it grows. The page behind can scroll; the overlay is fixed and does not care.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useApolloClient } from '@vue/apollo-composable'
import VariantIcon from '@/components/VariantIcon.vue'
import { avatarZoomState, closeAvatarZoom } from '@/composables/useAvatarZoom'
import { memberAvatarFull } from '@/graphql/queries'

// As close to the stored 512 as a screen usually allows, and never wider than the screen.
// 500 on a 2x display asks for 1000 real pixels from a 512 crop, which is soft and was
// weighed and accepted (AS-018) -- the alternative is a third rendition, and with it a
// migration and a re-encode of every picture that already exists.
const MAX_SIZE = 500
const VIEWPORT_SHARE = 0.86

// Long enough to read as growth, short enough not to sit between the tap and the face.
// Mirrored in the stylesheet; the two have to agree or the overlay is torn down mid-flight.
const DURATION_MS = 260

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

// What was focused before, so it can be handed back. A member who opened a face with the
// keyboard should land on the same circle again, not at the top of the document.
let returnFocusTo = null
let closeTimer = null
// ⚠️ Set SYNCHRONOUSLY by requestClose, before the shared state is cleared. The watcher
// below also reacts to that clearing, and it must be able to tell "this component is
// shrinking on purpose" from "somebody else dropped the state". Reading `closeTimer` for
// that would work only because Vue flushes watchers in a microtask, after the line that
// sets it -- a fact this file has no business depending on.
let closing = false
// Which open this is. An answer that arrives after the member has closed the overlay --
// or opened somebody else -- belongs to nobody, and must not paint over the face that is
// on screen now.
let openEpoch = 0

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

const readViewport = () => {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
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
 * A null answer -- withdrawn between the list and the tap, or never allowed -- is not an
 * error and shows nothing: the small picture that is already on screen stays. Same for a
 * failed request; a member looking at a face does not need to hear about the network.
 */
const fetchFull = async (member, epoch) => {
  try {
    const { data } = await client.query({
      query: memberAvatarFull,
      variables: { ref: { gradidoID: member.gradidoID, communityUuid: member.communityUuid } },
      fetchPolicy: 'no-cache',
    })
    if (epoch !== openEpoch || !data?.memberAvatarFull) return
    fullSource.value = `data:image/jpeg;base64,${data.memberAvatarFull}`
  } catch {
    // Nothing to say and nothing to do: the small rendition is already showing the face.
  }
}

const open = (value) => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  closing = false
  returnFocusTo = document.activeElement
  readViewport()
  openEpoch += 1
  fullSource.value = ''
  fullLoaded.value = false
  shown.value = value
  grown.value = false

  // Two frames, not one. Vue paints the element with its starting rectangle in the first;
  // changing the style inside that same frame would let the browser collapse both values
  // into one initial state, and there would be no growth at all -- just the finished
  // picture, appearing.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (shown.value === value) grown.value = true
    })
  })

  fetchFull(value.member, openEpoch)
}

const finishClose = () => {
  shown.value = null
  grown.value = false
  fullSource.value = ''
  fullLoaded.value = false
  closeTimer = null
  closing = false
  if (returnFocusTo?.focus) returnFocusTo.focus()
  returnFocusTo = null
}

// Shrinks back into the circle it came from, then lets go. The state is cleared first so
// that a second tap during the shrink opens cleanly rather than fighting this one.
const requestClose = () => {
  if (!shown.value || closing) return
  closing = true
  openEpoch += 1
  grown.value = false
  closeAvatarZoom()
  closeTimer = setTimeout(finishClose, DURATION_MS)
}

const onKeydown = (event) => {
  if (event.key === 'Escape') requestClose()
}

watch(avatarZoomState, (value) => {
  if (value) {
    open(value)
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', readViewport)
    return
  }
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', readViewport)
  // Cleared from somewhere else -- a route change, a logout. There is nothing to shrink
  // back into by then, so it goes at once.
  if (shown.value && !closing) finishClose()
})

// The one way out that is not a tap and not Escape: the browser's back button. The
// overlay covers the screen, so nothing inside it can navigate -- but the page underneath
// can change without it, and a face left hanging over a different page belongs to nobody.
watch(
  () => route?.path,
  () => {
    if (shown.value) requestClose()
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', readViewport)
  if (closeTimer) clearTimeout(closeTimer)
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
   where getBoundingClientRect() said the small one was -- the page behind may scroll
   without dragging it along. */
.avatar-zoom-frame {
  position: fixed;
  overflow: hidden;
  border-radius: 50%;
  background: rgb(0 0 0 / 20%);
  box-shadow: 0 18px 48px rgb(0 0 0 / 45%);
  transition:
    top 260ms cubic-bezier(0.22, 1, 0.36, 1),
    left 260ms cubic-bezier(0.22, 1, 0.36, 1),
    width 260ms cubic-bezier(0.22, 1, 0.36, 1),
    height 260ms cubic-bezier(0.22, 1, 0.36, 1);
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
   draws is smaller, and the rest is tap target. */
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
  transition: opacity 260ms ease;
  appearance: none;
}

.avatar-zoom-close .icon-variant {
  width: 28px;
  height: 28px;
}

.avatar-zoom-close.is-open {
  opacity: 1;
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
