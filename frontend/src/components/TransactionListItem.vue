<template>
  <div>
    <slot :name="typeId"></slot>
  </div>
</template>
<script>
export default {
  name: 'TransactionList',
  props: {
    typeId: {
      type: String,
      required: true,
    },
  },
}
</script>
