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
  The gap between the triads and what follows them is theirs, the same on all five doors:
  48px, and 24px on a phone. The gap above them is cut to 24px there as well. They come first
  in the card body, under the card's language row, whose own 24px of padding already stand
  between them -- the card body's padding on top of that made it 44px (Bernd, 22.09.2026:
  less space above and below, so that the card gets shorter). The margin is the card's own
  variable: outside a card it is undefined, and the rule drops out.
*/
.auth-triads {
  padding-bottom: 3rem;
}

@media (width <= 767.98px) {
  .auth-triads {
    margin-top: calc(-1 * var(--bs-card-spacer-y));
    padding-bottom: 1.5rem;
  }
}

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

/*
  A triad on one line wherever it fits, on every width (Bernd, 21.09.2026: the card is wider
  on a phone now). Where it does not, it breaks between two parts, not inside one -- no part
  is wider than a 320px phone's card in any of the ten languages -- and the stage takes the
  tallest triad's height: in German two lines on every phone instead of three.

  Measured in the built stylesheet, 16px: "Helfen. Schenken. Danken." is 196px wide and fits
  every phone in every language (Russian, the widest, 246px). "Für Dich und mich. Für die
  Gemeinschaft. Für die Natur." is 399px, where a 375px phone gives 315 -- and still 349 at
  14px, which is why the letters kept their size.
*/
.triad {
  display: flex;
  flex-flow: row wrap;
  place-content: center;
  align-items: center;
  column-gap: 0.3em;
  text-align: center;
}

.triad-sizer {
  visibility: hidden;
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
