<template>
  <div>
    <slot :name="path" />
  </div>
</template>

<script>
export default {
  name: 'ContentHeader',
  computed: {
    path() {
      return this.$route.path.replace(/^\/(.+?)(\/.+)?$/, '$1')
    },
  },
}
</script>
