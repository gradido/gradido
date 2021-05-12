<template>
  <div class="wrapper">
    <div class="main-content mt-4">
      <router-view></router-view>
      <language-switch class="text-center mb-5 mt-5" />
      <content-footer v-if="!$route.meta.hideFooter"></content-footer>
    </div>
  </div>
</template>
<script>
import ContentFooter from './ContentFooter.vue'
import LanguageSwitch from '@/components/LanguageSwitch.vue'
export default {
  components: {
    ContentFooter,
    LanguageSwitch,
  },
}
</script>
