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
