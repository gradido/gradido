<template>
  <div>
    <router-view class="p-3"></router-view>
    <content-footer v-if="!$route.meta.hideFooter"></content-footer>
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
