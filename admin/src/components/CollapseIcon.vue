<template>
  <div class="collapse-icon">
    <IBiArrowUpCircle v-if="visible" class="text-black h2" />
    <IBiArrowDownCircle v-else class="text-muted h2" />
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
