<template>
  <div
    class="skeleton-loader my-2"
    :class="{ 'with-animation': !disableAnimation }"
    :style="{
      width: computedWidth,
      height: computedHeight,
      borderRadius: computedRadius,
    }"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  width: {
    type: [String, Number],
    default: '100%',
  },
  height: {
    type: [String, Number],
    default: '1rem',
  },
  disableAnimation: {
    type: Boolean,
    default: false,
  },
  fullRadius: {
    type: Boolean,
    default: false,
  },
  useGradidoRadius: {
    type: Boolean,
  },
})

const computedWidth = computed(() => {
  if (typeof props.width === 'number') return `${props.width}px`
  return props.width
})

const computedHeight = computed(() => {
  if (typeof props.height === 'number') return `${props.height}px`
  return props.height
})

const computedRadius = computed(() => {
  return props.fullRadius ? '100%' : props.useGradidoRadius ? '26px' : '0'
})
</script>

<style scoped>
.skeleton-loader {
  background: #e9ecef; /* Bootstrap 5 gray-200 color */
  border-radius: 0.25rem;
}

.with-animation {
  position: relative;
  overflow: hidden;
}

.with-animation::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0.5) 60%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 2s infinite;
  content: '';
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
