<template>
  <div>
    <slot :name="type"></slot>
  </div>
</template>
<script setup>
defineProps({
  type: {
    type: String,
    required: true,
  },
})
</script>
