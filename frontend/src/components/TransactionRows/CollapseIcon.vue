<template>
  <div class="Collaps-Icon">
    <b-icon
      :icon="visible ? 'caret-up-square' : 'caret-down-square'"
      :class="visible ? 'text-black' : 'text-muted'"
    />
  </div>
</template>
<script>
export default {
  props: {
    visible: {
      type: Boolean,
    },
  },
}
</script>
