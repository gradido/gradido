<template>
  <div id="app" :class="$route.meta.requiresAuth ? 'font-sans text-gray-800' : ''" class="h-100">
    <component :is="$route.meta.requiresAuth ? 'DashboardLayout' : 'AuthLayoutGDD'" />
  </div>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout_gdd.vue'
import AuthLayoutGDD from '@/layouts/AuthLayout_gdd.vue'

export default {
  name: 'App',
  components: {
    DashboardLayout,
    AuthLayoutGDD,
  },
}
</script>
<style>
@font-face {
  font-family: 'WorkSans', sans-serif !important;
  src: url(./assets/scss/fonts/WorkSans-VariableFont_wght.ttf) format('truetype');
}
#app {
  min-width: 360px;
  font-size: 1rem;
  font-family: 'WorkSans', sans-serif !important;
}

@media screen and (max-width: 500px) {
  #app {
    font-size: 0.85rem;
  }
}
</style>
