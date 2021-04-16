<template>
  <div id="app" class="font-sans text-gray-800">
    <header>
      <b-col class="text-center">
        <b-dropdown
          size="sm"
          split
          variant="secondary"
          :text="$t('language') + ' - ' + $i18n.locale"
          class="m-md-2"
        >
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click.prevent="setLocale('de')">Deutsch</b-dropdown-item>
          <b-dropdown-item @click.prevent="setLocale('en')">English</b-dropdown-item>
        </b-dropdown>
      </b-col>
    </header>
    <div class="">
      <particles-bg type="custom" :config="config" :bg="true" />
      <component :is="$store.state.session_id ? 'DashboardLayout' : 'AuthLayoutGDD'" />
    </div>
  </div>
</template>

<script>
import { ParticlesBg } from 'particles-bg-vue'
import icon from './icon.js'
import { localeChanged } from 'vee-validate'
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
      session_id: null,
      email: '',
      language: 'en',
    }
  },
  created() {
    if ($cookies.isKey('gdd_session_id') == true) {
      //console.log('APP is COOKIE')
      this.$store.commit('session_id', $cookies.get('gdd_session_id'))
      this.$store.commit('email', $cookies.get('gdd_u'))
      if ($cookies.get('gdd_lang') != 'de' || $cookies.get('gdd_lang') != 'de') {
        this.$store.commit('language', 'de')
      } else {
        this.$store.commit('language', $cookies.get('gdd_lang'))
      }

      this.$i18n.locale = $cookies.get('gdd_lang')
      this.$router.push('overview')
    } else {
      //console.log('APP is NOOOOO COOKIE')
      if (window.location.pathname == '/reset') {
        this.$router.push('reset')
      } else {
        this.$store.dispatch('logout')
      }
    }
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
  methods: {
    setLocale(locale) {
      this.$i18n.locale = locale
      this.$store.commit('language', this.$i18n.locale)
      localeChanged(locale)
    },
  },
}
</script>
<style>
.btn-primary pim {
  background-color: #5a7b02;
  border-color: #5e72e4;
}
a,
.copyright {
  color: #5a7b02;
}
gradido-global-color-text {
  color: #3d443b;
}
gradido-global-color-accent {
  color: #047006;
}
gradido-global-color-6e0a9c9e {
  color: #000;
}
gradido-global-color-2d0fb154 {
  color: #047006;
}
gradido-global-color-16efe88c {
  color: #7ebc55;
}
gradido-global-color-1939326 {
  color: #f6fff6;
}
gradido-global-color-9d79fc1 {
  color: #047006;
}
gradido-global-color-6347f4d {
  color: #5a7b02;
}
gradido-global-color-4fbc19a {
  color: #014034;
}
gradido-global-color-d341874 {
  color: #b6d939;
}
gradido-global-color-619d338 {
  color: #8ebfb1;
}
gradido-global-color-44819a9 {
  color: #026873;
}
</style>
