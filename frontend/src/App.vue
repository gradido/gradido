<template>
  <div id="app" ref="app" :class="darkMode ? 'dark-mode' : ''">
    <BToastOrchestrator />
    <div :class="$route.meta.requiresAuth ? 'app-content' : ''">
      <component :is="$route.meta.requiresAuth ? 'DashboardLayout' : 'AuthLayout'" />
      <div class="goldrand position-fixed fixed-bottom zindex1000"></div>
    </div>
  </div>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout'
import AuthLayout from '@/layouts/AuthLayout'

export default {
  name: 'App',
  components: {
    DashboardLayout,
    AuthLayout,
  },
  computed: {
    darkMode() {
      return this.$store.state.darkMode
    },
  },
}
</script>

<style>
@font-face {
  font-family: WorkSans, sans-serif !important;
  src: url('./assets/scss/fonts/WorkSans-VariableFont_wght.ttf') format('truetype');
}

#app {
  font-size: 1rem;
  font-family: WorkSans, sans-serif !important;
}

.app-content {
  min-width: 330px;
  max-width: 1320px;
  margin-right: auto;
  margin-left: auto;
}

.app-box-shadow {
  box-shadow: 20pt 20pt 50pt 0 #3838384f;
}

@media screen and (width <= 500px) {
  #app {
    font-size: 0.85rem;
  }
}

@media screen and (width <= 1024px) {
  #app {
    padding-left: 15px;
    padding-right: 15px;
  }
}

.goldrand {
  background: linear-gradient(
    90deg,
    rgb(197 141 56 / 100%) 6%,
    rgb(243 205 124 / 100%) 30%,
    rgb(219 176 86 / 100%) 54%,
    rgb(238 192 95 / 100%) 63%,
    rgb(204 157 61 / 100%) 88%
  );
  height: 13px;
}

.text-color-gdd-yellow {
  color: rgb(197 141 56);
}

.dropdown > .dropdown-toggle {
  border-radius: 17px;
  height: 50px;
  text-align: left;
}

.dropdown-toggle::after {
  float: right;
  top: 50%;
  transform: translateY(-50%);
  position: relative;
}
</style>
