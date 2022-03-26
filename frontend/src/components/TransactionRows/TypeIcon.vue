<template>
  <div class="type-icon">
    <div class="gdd-transaction-list-item-icon">
      <b-icon :icon="icon" :class="color" class="m-mb-1 font2em" />
    </div>
  </div>
</template>
<script>
export default {
  name: 'TypeIcon',
  props: {
    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
}
</script>
