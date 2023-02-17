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
       console.log('ContentHeader', this.$route.path.replace(/^\/(.+?)(\/.+)?$/, '$1'))
       return this.$route.path.replace(/^\/(.+?)(\/.+)?$/, '$1')
     },
   },
 }
</script>
