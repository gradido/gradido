<template>
  <div id="app" class="font-sans text-gray-800">
    <div>
      <particles-bg v-if="$store.state.coinanimation" type="custom" :config="config" :bg="true" />
      <component :is="$route.meta.requiresAuth ? 'DashboardLayout' : 'AuthLayoutGDD'" />
    </div>
  </div>
</template>

<script>
import { ParticlesBg } from 'particles-bg-vue'
import icon from './icon.js'
import DashboardLayout from '@/views/Layout/DashboardLayout_gdd.vue'
import AuthLayoutGDD from '@/views/Layout/AuthLayout_gdd.vue'

export default {
  name: 'app',
  components: {
    ParticlesBg,
    DashboardLayout,
    AuthLayoutGDD,
  },
  data() {
    return {
      config: {
        num: [1, 7],
        rps: 15,
        radius: [5, 50],
        life: [6.5, 15],
        v: [1, 1],
        tha: [-40, 40],
        body: icon,
        alpha: [0.6, 0],
        scale: [0.1, 0.4],
        position: 'all',
        cross: 'dead',
        random: 2,
      },
    }
  },
}
</script>
