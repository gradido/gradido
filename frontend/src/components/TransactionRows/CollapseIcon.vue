<template>
  <div class="collapse-icon">
    <b-icon
      :icon="visible ? 'arrow-up-circle' : 'arrow-down-circle'"
      :class="visible ? 'text-black' : 'text-muted'"
      class="h1"
    />
  </div>
</template>
<script>
export default {
  name: 'CollapseIcon',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
}
</script>
