<template>
  <div>
    <nav-bar class="wrapper-nav" />
    <router-view class="wrapper p-3"></router-view>
    <foo-ter />
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'
import FooTer from '@/components/Footer.vue'
export default {
  name: 'defaultLayout',
  components: {
    NavBar,
    FooTer,
  },
}
</script>