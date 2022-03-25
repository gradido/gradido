<template>
  <div>
    <slot :name="type"></slot>
  </div>
</template>
<script>
export default {
  name: 'TransactionLinkItem',
  props: {
    type: {
      type: String,
      required: true,
    },
  },
}
</script>
