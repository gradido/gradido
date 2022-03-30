<template>
  <div id="app" :class="$route.meta.requiresAuth ? 'font-sans text-gray-800' : ''">
    <component :is="$route.meta.requiresAuth ? 'DashboardLayout' : 'AuthLayoutGDD'" />
  </div>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout_gdd.vue'
import AuthLayoutGDD from '@/layouts/AuthLayout_gdd.vue'

export default {
  name: 'app',
  components: {
    DashboardLayout,
    AuthLayoutGDD,
  },
}
</script>
<style>
#app {
  height: 100%;
}

.pointer {
  cursor: pointer;
}
</style>
