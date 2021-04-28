<template>
  <div class="main-content">
    <loading :active.sync="isLoading" :is-full-page="fullPage"></loading>
    <template>
      <div class="main-content">
        <router-view></router-view>
        <content-footer v-if="!$route.meta.hideFooter"></content-footer>
      </div>
    </template>
  </div>
</template>
<script>
// Import component
import Loading from 'vue-loading-overlay'
// Import stylesheet
import 'vue-loading-overlay/dist/vue-loading.css'

import ContentFooter from './ContentFooter.vue'

export default {
  data() {
    return {
      fullPage: true,
    }
  },
  components: {
    Loading,
    ContentFooter,
  },
}
</script>
