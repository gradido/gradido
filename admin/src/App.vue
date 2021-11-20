<template>
  <div id="app">
    <default-layout v-if="showLayout" />
    <router-view v-else></router-view>
  </div>
</template>

<script>
import defaultLayout from '@/layouts/defaultLayout.vue'
import CONFIG from './config'

export default {
  name: 'app',
  components: { defaultLayout },
  data() {
    return {
      showLayout: CONFIG.DEBUG_DISABLE_AUTH || this.$store.state.token,
    }
  },
}
</script>
