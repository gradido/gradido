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
  min-width: 360px;
  font-size: 1rem;
  font-family: 'WorkSans';
}
@font-face {
  font-family: 'WorkSans';
  src: url(./assets/scss/fonts/WorkSans-VariableFont_wght.ttf) format('truetype');
}
@media screen and (max-width: 500px) {
  #app {
    font-size: 0.85rem;
  }
}

.pointer {
  cursor: pointer;
}
</style>
