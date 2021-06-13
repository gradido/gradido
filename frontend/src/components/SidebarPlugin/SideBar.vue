<template>
  <nav
    class="navbar navbar-vertical fixed-left navbar-expand-md navbar-light bg-transparent"
    id="sidenav-main"
  >
    <div class="container-fluid">
      <div class="text-center">
        <div class="mb-2">
          <img :src="logo" class="navbar-brand-img" alt="Gradido Logo" />
        </div>
      </div>
      <div class="gddBalance text-center">{{ pending ? '—' : $n(balance, 'decimal') }} GDD</div>

      <div class="text-center">
        <div class="avatar">
          <vue-qrcode :value="$store.state.email" type="image/png"></vue-qrcode>
        </div>
      </div>

      <slot name="mobile-right">
        <ul class="nav align-items-center d-md-none">
          <a slot="title-container" class="nav-link" role="button">
            <div class="media align-items-center">
              <navbar-toggle-button @click.native="showSidebar"></navbar-toggle-button>
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
              <img :src="logo" />
            </div>
            <div class="col-6 collapse-close">
              <navbar-toggle-button @click.native="closeSidebar"></navbar-toggle-button>
            </div>
          </div>
        </div>
        <ul class="navbar-nav">
          <slot name="links"></slot>
        </ul>
        <hr class="my-2" />
        <ul class="navbar-nav ml-3">
          <li class="nav-item">
            <a
              :href="`https://elopage.com/s/gradido/sign_in?locale=${$i18n.locale}`"
              class="nav-link"
              target="_blank"
            >
              {{ $t('members_area') }}
            </a>
          </li>
        </ul>

        <ul class="navbar-nav ml-3">
          <li class="nav-item">
            <a class="nav-link pointer" @click="logout">
              {{ $t('logout') }}
            </a>
          </li>
        </ul>
        <div class="mt-5 ml-4">
          <language-switch />
        </div>
      </div>
    </div>
  </nav>
</template>
<script>
import NavbarToggleButton from '@/components/NavbarToggleButton'
import VueQrcode from 'vue-qrcode'
import LanguageSwitch from '@/components/LanguageSwitch.vue'

export default {
  name: 'sidebar',
  components: {
    NavbarToggleButton,
    VueQrcode,
    LanguageSwitch,
  },
  props: {
    logo: {
      type: String,
      default: 'img/brand/green.png',
      description: 'Gradido Sidebar app logo',
    },
    value: { type: Array },
    autoClose: {
      type: Boolean,
      default: true,
      description: 'Whether sidebar should autoclose on mobile when clicking an item',
    },
    balance: {
      type: Number,
      default: 0,
    },
    pending: {
      type: Boolean,
      default: true,
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
    logout() {
      this.$emit('logout')
    },
  },
}
</script>
<style>
.pointer {
  cursor: pointer;
}
</style>
