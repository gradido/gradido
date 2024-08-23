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
