<template>
  <div>
    <slot :name="typeId"></slot>
  </div>
</template>
<script>
export default {
  name: 'ContributionMessagesListItem',
  props: {
    typeId: {
      type: Number,
      required: true,
    },
  },
}
</script>
