<template>
  <div class="collapse-icon">
    <b-icon
      :icon="visible ? 'caret-up-square' : 'caret-down-square'"
      :class="visible ? 'text-black' : 'text-muted'"
    />
  </div>
</template>
<script>
export default {
  name: 'Collapse-Icon',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
}
</script>
