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
        <b-col>{{ pending ? '—' : $n(balance, 'decimal') }} GDD</b-col>
      </b-row>
      <slot name="mobile-right">
        <ul class="nav align-items-center d-md-none">
          <div class="media align-items-center">
            <span class="avatar avatar-sm">
              <vue-qrcode
                v-if="$store.state.email"
                :value="$store.state.email"
                type="image/png"
              ></vue-qrcode>
            </span>
          </div>
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
            <a :href="getElopageLink()" class="nav-link" target="_blank">
              {{ $t('members_area') }}&nbsp;
              <b-badge v-if="!this.$store.state.hasElopage" pill variant="danger">!</b-badge>
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
      </div>
    </div>
  </nav>
</template>
<script>
import NavbarToggleButton from '@/components/NavbarToggleButton'
import VueQrcode from 'vue-qrcode'

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
    value: { type: String },
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
    getElopageLink() {
      return this.$store.state.hasElopage
        ? `https://elopage.com/s/gradido/sign_in?locale=${this.$i18n.locale}&email=${this.$store.state.email}`
        : `https://elopage.com/s/gradido/basic-de/payment?locale=de&prid=111&pid=${this.$store.state.publisherId}&firstName=${this.$store.state.firstName}&lastName=${this.$store.state.lastName}&email=${this.$store.state.email}`
    },
  },
}
</script>
<style>
.pointer {
  cursor: pointer;
}
</style>
