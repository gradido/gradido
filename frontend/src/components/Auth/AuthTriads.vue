<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="auth-triads text-center">
    <!-- Screen readers get the three triads once, not again with every change. -->
    <span class="visually-hidden" data-test="triads-spoken">{{ spokenText }}</span>
    <div class="triad-stage" aria-hidden="true" data-test="triad-stage">
      <!--
        Every triad is laid out here once more, invisibly, in the same grid cell as the visible
        one. The cell therefore takes the height of the tallest triad in the current language,
        width and text size, and the form below does not move when one triad replaces another.
      -->
      <div
        v-for="triad in triads"
        :key="`sizer-${triad.name}`"
        class="triad triad-sizer"
        data-test="triad-sizer"
      >
        <span v-for="part in triad.parts" :key="part" class="triad-part">{{ part }}</span>
      </div>
      <Transition name="triad-slide">
        <div :key="shown.name" class="triad" :data-test="`triad-${shown.name}`">
          <span v-for="part in shown.parts" :key="part" class="triad-part">{{ part }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/** How long one triad stays before the next one slides in. */
const TRIAD_INTERVAL_MS = 7000
/** Two full rounds, then the slogan stays where it is. */
const ROUNDS = 2

const { t } = useI18n()

const triads = computed(() => [
  {
    name: 'slogan',
    parts: [
      t('auth.triads.slogan.help'),
      t('auth.triads.slogan.give'),
      t('auth.triads.slogan.thank'),
    ],
  },
  {
    name: 'design',
    parts: [
      t('auth.triads.design.communityBased'),
      t('auth.triads.design.decentralized'),
      t('auth.triads.design.openSource'),
    ],
  },
  {
    name: 'purpose',
    parts: [
      t('auth.triads.purpose.youAndMe'),
      t('auth.triads.purpose.community'),
      t('auth.triads.purpose.nature'),
    ],
  },
])

const spokenText = computed(() => triads.value.flatMap((triad) => triad.parts).join(' '))

const current = ref(0)
const shown = computed(() => triads.value[current.value])

let steps = 0
let timer = null

function stop() {
  clearInterval(timer)
  timer = null
  document.removeEventListener('focusin', stopWhenTyping)
}

function advance() {
  // A tab in the background does not use up the rounds: they are there to be seen.
  if (document.hidden) return
  current.value = (current.value + 1) % triads.value.length
  steps += 1
  // After two rounds the index is back at 0, the slogan.
  if (steps === ROUNDS * triads.value.length) stop()
}

function stopWhenTyping(event) {
  // Once somebody is in a form field, nothing moves next to what they are typing.
  if (event.target instanceof Element && event.target.closest('input, textarea, select')) stop()
}

onMounted(() => {
  timer = setInterval(advance, TRIAD_INTERVAL_MS)
  document.addEventListener('focusin', stopWhenTyping)
})

onBeforeUnmount(stop)
</script>

<style lang="scss" scoped>
/*
  The stage reaches 0.75rem into the padding of the surrounding container before it clips: a
  word longer than the column (Russian on a 320px phone) may stick out a little instead of
  being cut, and a triad sliding in still appears inside the card, not across its edge.
*/
.triad-stage {
  display: grid;
  overflow: hidden;
  margin-inline: -0.75rem;
  padding-inline: 0.75rem;
}

.triad-stage > * {
  grid-area: 1 / 1;
}

/* Phone: one part per line, so all three triads have the same shape. */
.triad {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.triad-sizer {
  visibility: hidden;
}

/*
  From lg on (see $grid-breakpoints) the picture carousel stands beside the form, and the column
  is wide enough for a triad on one line. Below that, tablets included, three lines: on a tablet
  a triad on one line would break at whatever part happens not to fit.
*/
@media (width >= 1025px) {
  .triad {
    flex-flow: row wrap;
    column-gap: 0.3em;
  }
}

/* The same movement and timing as the picture carousel on the desk. */
.triad-slide-enter-active,
.triad-slide-leave-active {
  transition: transform 0.6s ease-in-out;
}

.triad-slide-enter-from {
  transform: translateX(100%);
}

.triad-slide-leave-to {
  transform: translateX(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .triad-slide-enter-active,
  .triad-slide-leave-active {
    transition: opacity 0.6s ease-in-out;
  }

  .triad-slide-enter-from,
  .triad-slide-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>
