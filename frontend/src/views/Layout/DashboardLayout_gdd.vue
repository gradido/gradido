<template>
  <div class="wrapper">
    <notifications></notifications>
    <side-bar>
      <template slot="links">
        <b-nav-item href="#!" to="/overview">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('send') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item href="#!" to="/transactions">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('transactions') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item href="#!" to="/profile">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('site.navbar.my-profil') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item href="#!" to="/profileedit">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('site.navbar.settings') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item href="#!" to="/activity">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('site.navbar.activity') }}</b-nav-text>
        </b-nav-item>
      </template>
    </side-bar>
    <div class="main-content">
      <dashboard-navbar></dashboard-navbar>
      <router-view></router-view>
      <content-footer></content-footer>
    </div>
  </div>
</template>
<script>
import DashboardNavbar from './DashboardNavbar.vue'
import ContentFooter from './ContentFooter.vue'

export default {
  components: {
    DashboardNavbar,
    ContentFooter,
  },
}
</script>
<style lang="scss"></style>
