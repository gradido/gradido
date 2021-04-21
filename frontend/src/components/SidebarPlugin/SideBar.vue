<template>
  <nav
    class="navbar navbar-vertical fixed-left navbar-expand-md navbar-light bg-transparent"
    id="sidenav-main"
  >
    <div class="container-fluid">
      <!--Toggler-->
      <navbar-toggle-button @click.native="showSidebar"></navbar-toggle-button>
      <div class="navbar-brand">
        <img :src="logo" class="navbar-brand-img" alt="..." />
      </div>
      <b-row class="text-center">
        <b-col>{{ $n($store.state.user.balance) }} GDD</b-col>
      </b-row>
      <slot name="mobile-right">
        <ul class="nav align-items-center d-md-none">
          <a slot="title-container" class="nav-link" role="button">
            <div class="media align-items-center">
              <span class="avatar avatar-sm">
                <vue-qrcode :value="$store.state.email" type="image/png"></vue-qrcode>
              </span>
            </div>
          </a>
        </ul>
      </slot>
      <slot></slot>
      <div
        v-show="$sidebar.showSidebar"
        class="navbar-collapse collapse show"
        id="sidenav-collapse-main"
      >
        <div class="navbar-collapse-header d-md-none">
          <div class="row">
            <div class="col-6 collapse-brand">
              <router-link to="/overview">
                <img :src="logo" />
              </router-link>
            </div>
            <div class="col-6 collapse-close">
              <navbar-toggle-button @click.native="closeSidebar"></navbar-toggle-button>
            </div>
          </div>
        </div>
        <ul class="navbar-nav">
          <slot name="links"></slot>
        </ul>
        <hr class="my-3" />
        <ul class="navbar-nav mb-md-3">
          <li class="nav-item">
            <a
              :href="`https://elopage.com/s/gradido/sign_in?locale=${$i18n.locale}`"
              class="nav-link text-lg"
            >
              {{ $t('members_area') }}
            </a>
          </li>
        </ul>
        <hr class="my-3" />
        <ul class="navbar-nav mb-md-3">
          <li class="nav-item">
            <a class="nav-link text-lg" @click="logout">
              {{ $t('logout') }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
<script>
import NavbarToggleButton from '@/components/NavbarToggleButton'
import VueQrcode from 'vue-qrcode'
import loginAPI from '../../apis/loginAPI'

export default {
  name: 'sidebar',
  components: {
    NavbarToggleButton,
    VueQrcode,
  },
  props: {
    logo: {
      type: String,
      default: 'img/brand/green.png',
      description: 'Gradido Sidebar app logo',
    },
    autoClose: {
      type: Boolean,
      default: true,
      description: 'Whether sidebar should autoclose on mobile when clicking an item',
    },
  },
  provide() {
    return {
      autoClose: this.autoClose,
    }
  },
  methods: {
    closeSidebar() {
      this.$sidebar.displaySidebar(false)
    },
    showSidebar() {
      this.$sidebar.displaySidebar(true)
    },
    async logout() {
      //const result = await loginAPI.logout(this.$store.state.session_id)
      this.$store.dispatch('logout')
      this.$router.push('/login')
    },
  },
}
</script>
