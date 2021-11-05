<template>
  <div id="app">
    <nav-bar class="wrapper-nav" />
    <router-view class="wrapper p-3"></router-view>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'
export default {
  name: 'App',
  components: {
    NavBar,
  },
}
</script>
