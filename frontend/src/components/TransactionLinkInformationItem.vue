<template>
  <div>
    <slot :name="type"></slot>
  </div>
</template>
<script>
export default {
  name: 'TransactionLinkInformationItem',
  props: {
    type: {
      type: String,
      required: true,
    },
  },
}
</script>
