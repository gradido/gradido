<template>
  <div>
    <slot :name="type"></slot>
  </div>
</template>
<script>
export default {
  name: 'AuthItem',
  props: {
    type: {
      type: String,
      required: true,
    },
  },
}
</script>
