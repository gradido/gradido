<template>
  <IBiCheck v-if="props.icon === 'check'" class="icon-variant" />
  <IBiXCircle v-if="props.icon === 'x-circle'" class="icon-variant" />
  <IBiLink45deg v-if="props.icon === 'link45deg'" class="icon-variant" />
  <IBiLink v-if="props.icon === 'link'" class="icon-variant" />
  <IBiDropletHalf v-if="props.icon === 'droplet-half'" class="icon-variant" />
  <IBiTrash v-if="props.icon === 'trash'" class="icon-variant" />
  <IBiQuestion v-if="props.icon === 'question'" class="icon-variant" />
  <IBiBellFill v-if="props.icon === 'bell-fill'" class="icon-variant" />
  <IBiExclamationTriangle v-if="props.icon === 'exclamation-triangle'" class="icon-variant" />
  <IBiHeart v-if="props.icon === 'heart'" class="icon-variant" />
  <IBiPersonCheck v-if="props.icon === 'person-check'" class="icon-variant" />
  <IBiGift v-if="props.icon === 'gift'" class="icon-variant" />
  <!-- A bunch of flowers, for a thank-you greeting: three blossoms, their stems tied. Drawn
       here -- none of the icon sets the wallet carries has one (Bernd chose it on 04.10.2026).
       Sized as the set's icons are (1.2em), in the colour of the text around it.
       Tilted, as a bunch held out to somebody is: upright it stood stiff (Bernd, the same
       day). The turn is around the middle of the drawing and keeps all of it inside the box. -->
  <svg
    v-if="props.icon === 'bouquet'"
    class="icon-variant"
    width="1.2em"
    height="1.2em"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1"
    stroke-linecap="round"
    aria-hidden="true"
    data-test="icon-bouquet"
  >
    <g transform="rotate(22 8 8.5)">
      <circle cx="4.2" cy="4" r="1.9" />
      <circle cx="8" cy="2.9" r="1.9" />
      <circle cx="11.8" cy="4" r="1.9" />
      <path
        d="M4.8 5.8L8 10.5M8 4.8v5.7M11.2 5.8L8 10.5M6.3 10.5h3.4M8 10.5l-2 4.2M8 10.5v4.5M8 10.5l2 4.2"
      />
    </g>
  </svg>
  <!-- Two cards lying on top of each other. Deliberately NOT a credit card: a thank you
       card is a printed piece of paper, and every card icon that carries a chip or a
       magnetic stripe says bank. (Bernd chose this one on 19.08.2026.) -->
  <ITablerCards v-if="props.icon === 'cards'" class="icon-variant" />
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  icon: { type: String, default: '' },
  variant: { type: String, default: 'gray-dark' },
})

const color = ref(`var(--bs-${props.variant})`)
</script>

<style scoped lang="scss">
:root {
  --bs-gold: #c58d38;
}

.icon-variant {
  color: v-bind('color');
}
</style>
