<template>
  <div id="app" :class="$route.meta.requiresAuth ? 'font-sans text-gray-800' : ''">
    <component :is="$route.meta.requiresAuth ? 'DashboardLayout' : 'AuthTemplate'" />
  </div>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout_gdd.vue'
import AuthTemplate from '@/layouts/AuthTemplate.vue'

export default {
  name: 'app',
  components: {
    DashboardLayout,
    AuthTemplate,
  },
}
</script>
<style>
.pointer {
  cursor: pointer;
}
</style>
