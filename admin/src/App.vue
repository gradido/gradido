<template>
  <div id="app">
    <nav-bar class="wrapper-nav" />
    <router-view class="wrapper p-3"></router-view>
    <content-footer />
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'
import ContentFooter from '@/components/ContentFooter.vue'
export default {
  name: 'App',
  components: {
    NavBar,
    ContentFooter,
  },
}
</script>
