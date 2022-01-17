<template>
  <div class="wrapper">
    <b-container class="mt-4">
      <router-view></router-view>
      <language-switch v-if="$route.path !== '/register'" class="text-center mb-5 mt-5" />
      <content-footer v-if="!$route.meta.hideFooter"></content-footer>
    </b-container>
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
