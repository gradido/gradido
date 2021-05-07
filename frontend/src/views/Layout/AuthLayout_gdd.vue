<template>
  <div class="wrapper">
    <div class="main-content">
      <router-view></router-view>
      <content-footer v-if="!$route.meta.hideFooter"></content-footer>
    </div>
  </div>
</template>
<script>
import ContentFooter from './ContentFooter.vue'
export default {
  components: {
    ContentFooter,
  },
}
</script>
