<template>
  <div id="app">
    <default-layout v-if="$store.state.token" />
    <router-view v-else></router-view>
  </div>
</template>

<script>
import defaultLayout from '@/layouts/defaultLayout.vue'

export default {
  name: 'app',
  components: { defaultLayout },
}
</script>
