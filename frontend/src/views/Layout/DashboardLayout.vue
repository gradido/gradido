<template>
  <div class="wrapper">
    <notifications></notifications>
    <side-bar>
      <template slot="links" >
       
         <b-nav-item href="#!" to="/KontoOverview">
               
              <b-nav-text class="p-0 text-lg text-muted">Senden</b-nav-text>
          </b-nav-item>
         <b-nav-item href="#!" to="/profile">
             
              <b-nav-text class="p-0 text-lg text-muted">Profil</b-nav-text>
          </b-nav-item>
         <b-nav-item href="#!" to="/profileedit">
              
              <b-nav-text class="p-0 text-lg text-muted">Settings</b-nav-text>
          </b-nav-item>
         <b-nav-item href="#!" to="/activity">
             
              <b-nav-text class="p-0 text-lg text-muted">Activity</b-nav-text>
          </b-nav-item>
          
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
