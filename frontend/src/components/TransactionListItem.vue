<template>
  <div>
    <slot name="item" />
    <slot :name="typeId"></slot>
  </div>
</template>
<script setup>
defineProps({
  typeId: {
    type: String,
    required: true,
  },
})
</script>
