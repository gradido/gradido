<template>
  <div id="app">
    <div :class="$route.meta.requiresAuth ? 'appContent' : ''">
      <component :is="$route.meta.requiresAuth ? 'DashboardLayout' : 'AuthLayout'" />
      <div class="goldrand position-fixed fixed-bottom zindex1000"></div>
    </div>
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
  font-size: 1rem;
  font-family: 'WorkSans', sans-serif !important;
}
.appContent {
  min-width: 360px;
  max-width: 1320px;
  margin-right: auto;
  margin-left: auto;
}
.appBoxShadow {
  -webkit-box-shadow: 20pt 20pt 50pt 0 #3838384f;
  box-shadow: 20pt 20pt 50pt 0 #3838384f;
}
@media screen and (max-width: 500px) {
  #app {
    font-size: 0.85rem;
  }
}
@media screen and (max-width: 1024px) {
  #app {
    padding-left: 15px;
    padding-right: 15px;
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

.text-color-gdd-yellow {
  color: rgb(197 141 56);
}
</style>
