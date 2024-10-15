<template>
  <div>
    <slot name="item" />
    <slot :name="typeId"></slot>
  </div>
</template>
<script>
export default {
  name: 'TransactionListItem',
  props: {
    typeId: {
      type: String,
      required: true,
    },
  },
}
</script>
