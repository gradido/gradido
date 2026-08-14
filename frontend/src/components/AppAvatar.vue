<template>
  <div
    class="app-avatar d-flex justify-content-center align-items-center rounded-circle"
    :class="{ 'app-avatar-quiet': quiet && !src }"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: src || quiet ? undefined : backgroundColor,
      textTransform: 'uppercase',
    }"
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
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
  // The "quiet" look for an avatar that has no picture yet: a pale disc with a dashed
  // ring instead of a solid colour, so an unfilled place looks like an unfilled place.
  // Only meaningful where the member can act on it — their own avatar.
  quiet: {
    type: Boolean,
    default: false,
  },
})

// Enhanced color palette with better contrast ratios
const colorPalette = [
  { bg: '#4A5568', text: '#FFFFFF' }, // Slate Blue
  { bg: '#2C7A7B', text: '#FFFFFF' }, // Teal
  { bg: '#805AD5', text: '#FFFFFF' }, // Purple
  { bg: '#DD6B20', text: '#FFFFFF' }, // Orange
  { bg: '#3182CE', text: '#FFFFFF' }, // Blue
  { bg: '#38A169', text: '#FFFFFF' }, // Green
  { bg: '#E53E3E', text: '#FFFFFF' }, // Red
  { bg: '#6B46C1', text: '#FFFFFF' }, // Indigo
  { bg: '#2B6CB0', text: '#FFFFFF' }, // Dark Blue
  { bg: '#9C4221', text: '#FFFFFF' }, // Brown
]

// Generate consistent index based on string
function stringToIndex(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash % colorPalette.length)
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
  return props.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const backgroundColor = computed(() => {
  const colorIndex = stringToIndex(computedInitials.value || props.name)
  return colorPalette[colorIndex].bg
})

const textColor = computed(() => {
  if (props.color) {
    return getTextColor(props.color)
  }
  const colorIndex = stringToIndex(computedInitials.value || props.name)
  return colorPalette[colorIndex].text
})
</script>

<style lang="scss">
/* Comments here must be block comments: lightningcss parses SFC style blocks, and a
   double slash is not a comment to it -- the build dies with "Invalid empty selector". */
.app-avatar {
  overflow: hidden;
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
