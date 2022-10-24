<template>
  <div class="mt-2">
    <span v-for="({ type, text }, index) in linkifiedMessage" :key="index">
      <b-link v-if="type === 'link'" :to="text">{{ text }}</b-link>
      <span v-else>{{ text }}</span>
    </span>
  </div>
</template>

<script>
export default {
  name: 'LinkifyMessage',
  props: {
    linkifiedMessage: {
      type: Array,
      required: true,
    },
  },
}
</script>
