<template>
  <div class="right-side mt-3 mt-lg-0">
    <BContainer>
      <slot :name="name" />
    </BContainer>
  </div>
</template>
<script>
export default {
  name: 'RightSide',
  computed: {
    name() {
      switch (this.$route.path.replace(/^\/(.+?)(\/.+)?$/, '$1')) {
        case 'settings':
          return 'empty'
        case 'contributions':
          return 'contributions'
        default:
          return 'transactions'
      }
    },
  },
}
</script>
