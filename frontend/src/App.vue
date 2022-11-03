<template>
  <div id="app" class="placeholder">
    <component :is="$route.meta.requiresAuth ? 'DashboardLayout' : 'AuthLayout'" />
    <div class="goldrand position-fixed w-100 fixed-bottom zindex1000"></div>
  </div>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

export default {
  name: 'App',
  components: {
    DashboardLayout,
    AuthLayout,
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

.goldrand {
  background: linear-gradient(
    90deg,
    rgba(197, 141, 56, 1) 6%,
    rgba(243, 205, 124, 1) 30%,
    rgba(219, 176, 86, 1) 54%,
    rgba(238, 192, 95, 1) 63%,
    rgba(204, 157, 61, 1) 88%
  );
  height: 13px;
}
</style>
