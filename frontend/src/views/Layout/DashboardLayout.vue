<template>
  <div class="wrapper">
    <notifications></notifications>
    <side-bar>
      <template slot="links">
        <sidebar-item
          :link="{
            name: 'Kontoübersicht',
            path: 'KontoOverview',
            icon: 'ni ni-tv-2 text-primary',
          }"
        >
        </sidebar-item> 
        <sidebar-item
              :link="{
                name: 'Profil',
                path: '/profile',
                icon: 'ni ni-single-02 text-yellow'
                }">
        </sidebar-item>
        <sidebar-item
              :link="{
                name: 'Settings',
                path: '/profileedit',
                icon: 'ni ni-single-02 text-yellow'
                }">
        </sidebar-item>
        <sidebar-item
              :link="{
                name: 'Activity',
                path: '/activity',
                icon: 'ni ni-single-02 text-yellow'
                }">
        </sidebar-item>
         <b-nav-item href="#!" @click="logout">
              <i class="ni ni-palette"></i>
              <b-nav-text class="p-0">Logout</b-nav-text>
          </b-nav-item>
      </template>

      <template slot="links-after">
        <hr class="my-3">
        <h6 class="navbar-heading p-0 text-muted">Community</h6>

        <b-nav class="navbar-nav mb-md-3">
          <b-nav-item
               href="https://gradido.net/de/" target="_blank"
               >
              <i class="ni ni-spaceship"></i>
              <b-nav-text class="p-0">GRADIDO.net</b-nav-text>
          </b-nav-item>
          <b-nav-item href="https://elopage.com/s/gradido/sign_in">
              <i class="ni ni-palette"></i>
              <b-nav-text class="p-0">Mitgliederbereich</b-nav-text>
          </b-nav-item>
          <b-nav-item href="https://gradido.net/de/memberships/">
              <i class="ni ni-ui-04"></i>
              <b-nav-text class="p-0">Mitgliedschaft</b-nav-text>
          </b-nav-item>
        </b-nav>
      </template>
    </side-bar>
    <div class="main-content">
      <dashboard-navbar :type="$route.meta.navbarType"></dashboard-navbar>

      <div @click="$sidebar.displaySidebar(false)">
        <fade-transition :duration="200" origin="center top" mode="out-in">
          <!-- your content here -->
          <router-view></router-view>
        </fade-transition>
      </div>
      <content-footer v-if="!$route.meta.hideFooter"></content-footer>
    </div>
  </div>
</template>
<script>
  /* eslint-disable no-new */
  import PerfectScrollbar from 'perfect-scrollbar';
  import 'perfect-scrollbar/css/perfect-scrollbar.css';

  function hasElement(className) {
    return document.getElementsByClassName(className).length > 0;
  }

  function initScrollbar(className) {
    if (hasElement(className)) {
      new PerfectScrollbar(`.${className}`);
    } else {
      // try to init it later in case this component is loaded async
      setTimeout(() => {
        initScrollbar(className);
      }, 100);
    }
  }

  import DashboardNavbar from './DashboardNavbar.vue';
  import ContentFooter from './ContentFooter.vue';
  import DashboardContent from './Content.vue';
  import { FadeTransition } from 'vue2-transitions';

  export default {
    components: {
      DashboardNavbar,
      ContentFooter,
      // DashboardContent,
      FadeTransition
    },
    methods: {
      initScrollbar() {
        let isWindows = navigator.platform.startsWith('Win');
        if (isWindows) {
          initScrollbar('sidenav');
        }
      },
       logout(){
          //console.log("DashboardLayout.vue user logout() : ")
          this.$store.dispatch('logout')
        }  
    },
    mounted() {
      this.initScrollbar()
    }
  };
</script>
<style lang="scss">
</style>
