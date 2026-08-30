<template>
  <!-- A button only where there is something to open, a plain div everywhere else. The
       alternative -- always a button, disabled when there is nothing to show -- puts a
       tab stop on every circle in a booking list and announces twenty-five disabled
       controls to a screen reader for one picture. -->
  <component
    :is="opensPicture ? 'button' : 'div'"
    ref="root"
    class="app-avatar d-flex justify-content-center align-items-center rounded-circle"
    :class="{ 'app-avatar-quiet': quiet && !src, 'app-avatar-zoomable': opensPicture }"
    :type="opensPicture ? 'button' : undefined"
    :aria-label="opensPicture ? zoomLabel : undefined"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: src || quiet ? undefined : backgroundColor,
      textTransform: 'uppercase',
    }"
    @click="onClick"
  >
    <img v-if="src" class="app-avatar-image" :src="src" alt="" />
    <span
      v-else
      :style="{
        fontSize: `${size * 0.4}px`,
        lineHeight: '1',
        color: quiet ? undefined : props.color,
      }"
      class="font-medium"
    >
      {{ computedInitials }}
    </span>
  </component>
</template>

<script setup>
import { computed, ref } from 'vue'
import { AVATAR_COLOR_PALETTE, avatarPaletteEntry } from '@/utils/avatarColor'

const props = defineProps({
  size: {
    type: Number,
    default: 50,
  },
  color: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  initials: {
    type: String,
    default: '',
  },
  // A picture to show instead of the initials. Any image source works; the wallet passes
  // a base64 data URI. Without it nothing changes for the callers that had none.
  src: {
    type: String,
    default: '',
  },
  // Where the circle's COLOUR comes from, when that should not be what the circle SHOWS.
  // The two parted company when the letters started coming from the alias (AS-010): a
  // circle reading "BE" still colours from "BH", which is why no existing member's colour
  // moved and why the printed card still matches the screen.
  //
  // ⛔ The default is null, not '', and the difference is a real member: one who has an
  // alias but no stored name has an empty seed, and an empty seed is an ANSWER -- it is
  // what `useGradidoCard` and `useThankYouCheque` hand the palette for the same member.
  // Treated as "not given" it would fall through to the letters below, and the disc would
  // take its colour from the alias, which is the one thing AS-010 forbids. null means not
  // given; '' means given and empty.
  colorSeed: {
    type: String,
    default: null,
  },
  // The circle's colour as a finished palette index (0-9), computed by the server from
  // the real initials (NU-017). It exists for members whose names this browser no
  // longer receives: the seed above cannot be built for them, but their circle must
  // stay the colour it always was (AS-010). Where it is given and valid it wins over
  // colorSeed; null means not given, and everything falls back to the seed path that
  // every caller with a local name still uses.
  colorIndex: {
    type: Number,
    default: null,
  },
  // The "quiet" look for an avatar that has no picture yet: a pale disc with a dashed
  // ring instead of a solid colour, so an unfilled place looks like an unfilled place.
  // Only meaningful where the member can act on it — their own avatar.
  quiet: {
    type: Boolean,
    default: false,
  },
  // Whether tapping this circle opens the picture at full size (AS-018). Off by default,
  // so every existing caller keeps the plain circle it had.
  //
  // ⛔ Set it only where there IS a picture. A zoomable circle showing letters promises
  // something it cannot deliver -- `avatarZoomBindings` is what decides that, and it hands
  // back nothing at all for a member without one.
  //
  // ⛔ And never inside a caller that already wraps this component in a button.
  // `Avatar/AvatarButton.vue` does exactly that, so `zoomable` there would render
  // <button><button>, which the HTML parser closes early -- the overlay and the badge fall
  // outside it and the change-picture click dies, with nothing red to say so. The obvious
  // next ask ("let me see my OWN picture bigger") lands precisely there; it needs the
  // wrapper's own handler, not this prop.
  zoomable: {
    type: Boolean,
    default: false,
  },
  // What a screen reader says about the button. Empty is a real answer here: an avatar
  // whose member has no name to announce still opens, and a label made of nothing is
  // better than one made of an id.
  zoomLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['zoom'])

const root = ref(null)

/**
 * Whether this circle actually opens anything: the caller asked for it AND there is a
 * picture to open.
 *
 * ⛔ Both halves, structurally, rather than the prop alone. `avatarZoomBindings` never sets
 * `zoomable` without a `src`, but this is a shared component and that is a convention its
 * callers keep, not a rule this file enforces -- and a button drawn over letters stops the
 * booking row's own click and then emits a zoom that `openAvatarZoom` refuses for want of a
 * picture. A tap that consumes itself and does nothing is worse than the plain circle it
 * replaced.
 */
const opensPicture = computed(() => props.zoomable && Boolean(props.src))

// The rectangle the picture occupies RIGHT NOW, handed up so the overlay can grow out of
// it. Measured here rather than at the call site: the call site knows which member this
// is, this knows where the circle ended up.
//
// ⛔ `.stop` in code rather than in the template, because it is not decoration: the
// booking row this sits inside opens its own details on click. Without it, looking at
// somebody's face also unfolds the booking underneath the overlay -- and closing the
// overlay reveals a row that changed for no reason the member can connect to anything.
//
// ⚠️ AFTER the measurement, not before it. Stopped first, a circle that cannot report
// where it is -- `zoomable` set without `onZoom` bound, which nothing but convention
// couples -- would swallow the tap and do neither thing: no picture, and no row either.
// A dead circle is worse than one that behaves like the plain circle it used to be.
const onClick = (event) => {
  if (!opensPicture.value) return
  const element = root.value?.$el ?? root.value
  if (!element?.getBoundingClientRect) return
  event.stopPropagation()
  emit('zoom', element.getBoundingClientRect())
}

// Parse any color format to RGB
function parseColor(color) {
  const div = document.createElement('div')
  div.style.color = color
  document.body.appendChild(div)
  const computed = window.getComputedStyle(div).color
  document.body.removeChild(div)

  const match = computed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (!match) return [0, 0, 0]

  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
}

// Calculate relative luminance using WCAG formula
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Calculate contrast ratio using WCAG formula
function getContrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Get text color based on background ensuring WCAG AA compliance (4.5:1 minimum)
function getTextColor(backgroundColor) {
  const [r, g, b] = parseColor(backgroundColor)
  const bgLuminance = getLuminance(r, g, b)
  const whiteLuminance = getLuminance(255, 255, 255)
  const blackLuminance = getLuminance(0, 0, 0)

  const whiteContrast = getContrastRatio(whiteLuminance, bgLuminance)
  const blackContrast = getContrastRatio(blackLuminance, bgLuminance)

  // Return the color with better contrast (minimum 4.5:1 for WCAG AA)
  return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000'
}

const computedInitials = computed(() => {
  if (props.initials) return props.initials
  // `?? ''`, not a bare read: `default` only fills an ABSENT prop, so a caller that
  // passes an explicit null -- a deleted author's name, for one -- reaches `.split` on
  // null and tears the whole thread down. An empty circle is the right answer there.
  return (props.name ?? '')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// What the colour is drawn from. `??`, not `||`: only an absent seed falls back to what is
// shown, which is what every caller that predates colorSeed relied on. An empty seed is
// used as it stands -- see the prop above.
const paletteSeed = computed(() => props.colorSeed ?? (computedInitials.value || props.name))

// The server-sent index, taken only when it is a real palette index. Anything else --
// null from a caller without one, or a value outside the palette -- falls back to the
// seed path rather than crashing the lookup or inventing a colour.
const paletteEntry = computed(() => {
  const index = props.colorIndex
  if (Number.isInteger(index) && index >= 0 && index < AVATAR_COLOR_PALETTE.length) {
    return AVATAR_COLOR_PALETTE[index]
  }
  return avatarPaletteEntry(paletteSeed.value)
})

const backgroundColor = computed(() => paletteEntry.value.bg)

// ⚠️ Nothing reads this, and wiring it into the template would be a regression rather than
// a fix -- which is why it is spelled out here instead of left looking like an oversight.
// The template uses `color` as the LETTER colour; this treats it as a BACKGROUND to
// contrast against, so `color: '#fff'` -- what both booking views pass -- turns from white
// letters into black ones on a saturated disc.
//
// The real question underneath is what a caller that passes no colour at all should get:
// today the letters inherit, while the palette has a matching `text` for every background
// and nothing uses it. That is worth settling, and it is a change to how existing screens
// look (the moderation dialog is the one caller with no colour), so it does not belong to
// a delivery about showing faces.
const textColor = computed(() => {
  if (props.color) {
    return getTextColor(props.color)
  }
  return paletteEntry.value.text
})
</script>

<style lang="scss">
/* Comments here must be block comments: lightningcss parses SFC style blocks, and a
   double slash is not a comment to it -- the build dies with "Invalid empty selector". */
.app-avatar {
  overflow: hidden;
}

/* A button that has to look exactly like the div it replaces -- every one of these undoes
   something the user agent adds. `appearance` last, because Safari keeps its own control
   styling without it even when border and background are set. */
.app-avatar-zoomable {
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
  appearance: none;
}

/* Keyboard focus has to be visible, and an outline on a circle has to follow it. Drawn
   OUTSIDE the shape (offset), because the picture fills the circle edge to edge and an
   inset ring would sit on somebody's face. */
.app-avatar-zoomable:focus-visible {
  outline: 2px solid #276e6f;
  outline-offset: 2px;
}

.dark-mode .app-avatar-zoomable:focus-visible {
  outline-color: #8ed0d1;
}

.app-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* The empty state, when the member can still fill it. A dashed ring is the commonly
   understood notation for "something is missing here" -- it does not push, but it is
   read, and it stops an avatar without a picture from looking like a finished thing. */
.app-avatar-quiet {
  background-color: #e4efef;
  color: #276e6f;
  border: 1.5px dashed #a9cccc;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.app-avatar-quiet span {
  color: #276e6f !important;
}

/* The saturated wallet colour does not carry in the dark; these are its own values. */
.dark-mode .app-avatar-quiet {
  background-color: #243a3b;
  border-color: #47797a;
}

.dark-mode .app-avatar-quiet span {
  color: #8ed0d1 !important;
}
</style>
