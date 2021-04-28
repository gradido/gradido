<template>
  <div class="main-content">
    <template>
      <div class="main-content">
        <router-view></router-view>
        <content-footer v-if="!$route.meta.hideFooter"></content-footer>
      </div>
    </template>
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
