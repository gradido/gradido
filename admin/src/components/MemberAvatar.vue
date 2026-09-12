<!-- AI-GENERATED — not an architecture reference -->

<!-- A button only where there is a picture to open, a plain div everywhere else: a tab stop
     on every circle of a moderation list would announce twenty controls that do nothing.

     ⛔ The note stands HERE and not inside the template: a comment as the first node makes
     this a multi-root component, and a multi-root component silently drops the class its
     caller passes (`class="mt-2"` on the row's circle). Found by its own spec, where the
     root came back as a comment node. -->
<template>
  <component
    :is="opensPicture ? 'button' : 'div'"
    class="member-avatar d-inline-flex justify-content-center align-items-center rounded-circle"
    :class="{ 'member-avatar-openable': opensPicture }"
    :type="opensPicture ? 'button' : undefined"
    :title="opensPicture ? zoomLabel : undefined"
    :aria-label="opensPicture ? zoomLabel : undefined"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: src ? undefined : palette.bg,
      textTransform: 'uppercase',
    }"
    data-test="member-avatar"
    @click="opensPicture && $emit('zoom')"
  >
    <img v-if="src" class="member-avatar-image" :src="src" alt="" />
    <span
      v-else
      :style="{ fontSize: `${size * 0.4}px`, lineHeight: '1', color: palette.text }"
      class="fw-medium"
    >
      {{ initials }}
    </span>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AVATAR_COLOR_PALETTE, avatarPaletteEntry } from '@/utils/avatarColor'

const props = defineProps({
  size: { type: Number, default: 48 },
  name: { type: String, default: '' },
  initials: { type: String, default: '' },
  // A picture instead of the letters. The moderation interface passes a base64 data URI.
  src: { type: String, default: '' },
  // Where the COLOUR comes from, when that is not what the circle SHOWS: the letters follow
  // the alias, the colour keeps following the real initials (AS-010).
  colorSeed: { type: String, default: null },
  // The same colour as a finished palette index, computed by the server from the real
  // initials (NU-017) -- for rows where the real name is not delivered at all. Where it is
  // given and valid it wins over the seed.
  colorIndex: { type: Number, default: null },
})

defineEmits(['zoom'])

const opensPicture = computed(() => Boolean(props.src))

// The wallet's words for the same thing, under the same keys -- the two interfaces show the
// same people, and a member should not be "enlarged" here and "opened" there. Without a name
// the plain form, so a row whose member has no alias still says what the button does.
const { t } = useI18n()
const zoomLabel = computed(() =>
  props.name ? t('avatar.zoom-open', { name: props.name }) : t('avatar.zoom-open-plain'),
)

const palette = computed(() => {
  if (Number.isInteger(props.colorIndex) && AVATAR_COLOR_PALETTE[props.colorIndex]) {
    return AVATAR_COLOR_PALETTE[props.colorIndex]
  }
  // `?? initials`: a caller that has no separate seed colours from what the circle shows,
  // which is what every circle did before the two parted company.
  return avatarPaletteEntry(props.colorSeed ?? props.initials)
})
</script>

<style scoped>
.member-avatar {
  overflow: hidden;
  border: 0;
  padding: 0;
  flex: 0 0 auto;
}

.member-avatar-openable {
  cursor: pointer;
}

.member-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
