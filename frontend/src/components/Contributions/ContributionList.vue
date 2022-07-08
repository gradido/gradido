<template>
  <div class="contribution-list container">
    <div v-for="item in items" :key="item.id" class="pb-3">
      {{ item }}
    </div>
  </div>
</template>
<script>
export default {
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
}
</script>
