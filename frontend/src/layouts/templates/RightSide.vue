<template>
  <div class="right-side mt-3 mt-lg-0">
    <slot :name="name" />
  </div>
</template>
<script>
export default {
  name: 'RightSide',
  computed: {
    name() {
      switch (this.$route.path.replace(/^\//, '')) {
        case 'settings':
          return 'empty'
        case 'community':
          return 'community'
        default:
          return 'transactions'
      }
    },
  },
}
</script>
