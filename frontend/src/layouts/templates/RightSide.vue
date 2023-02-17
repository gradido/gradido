<template>
  <div class="right-side mt-3 mt-lg-0">
    <b-container>
      <slot :name="name" />
    </b-container>
  </div>
</template>
<script>
 export default {
   name: 'RightSide',
   computed: {
     name() {
       console.log('RightSide', this.$route.path.replace(/^\/(.+?)(\/.+)?$/, '$1'))
       switch (this.$route.path.replace(/^\/(.+?)(\/.+)?$/, '$1')) {
         case 'settings':
           return 'empty'
         case 'community':
           console.log('-----------')
           return 'community'
         default:
           return 'transactions'
       }
     },
   },
 }
</script>
