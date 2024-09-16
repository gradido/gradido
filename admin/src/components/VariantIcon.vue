<template>
  <IBiCheck v-if="props.icon === 'check'" class="icon-variant" />
  <IBiXCircle v-if="props.icon === 'x-circle'" class="icon-variant" />
  <IBiPersonFill v-if="props.icon === 'person-fill'" class="icon-variant" />
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  icon: { type: String, default: '' },
  variant: { type: String, default: 'success' },
})

const color = ref(`var(--bs-${props.variant}`)
</script>

<style scoped lang="scss">
.icon-variant {
  color: v-bind('color');
}
</style>
