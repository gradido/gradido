<template>
    <nav class="navbar navbar-vertical fixed-left navbar-expand-md navbar-light bg-white" id="sidenav-main">
        <div class="container-fluid">

            <!--Toggler-->
            <navbar-toggle-button @click.native="showSidebar">
                
            </navbar-toggle-button>
            <router-link class="navbar-brand" to="/">
                <img :src="logo" class="navbar-brand-img" alt="...">
            </router-link>

            <slot name="mobile-right">
                <ul class="nav align-items-center d-md-none">
                    <base-dropdown class="nav-item" menu-on-right tag="li" title-tag="a">
                        <a slot="title-container" class="nav-link nav-link-icon" href="#" role="button"
                           aria-haspopup="true" aria-expanded="false">
                            <i class="ni ni-bell-55"></i>
                        </a>

                        <a class="dropdown-item" href="#">Action</a>
                        <a class="dropdown-item" href="#">Another action</a>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item" href="#">Something else here</a>
                    </base-dropdown>
                    <base-dropdown class="nav-item" menu-on-right tag="li" title-tag="a">
                        <a slot="title-container" class="nav-link" href="#" role="button">
                            <div class="media align-items-center">
                              <span class="avatar avatar-sm rounded-circle">
                                <img alt="Image placeholder" src="img/theme/team-1.jpg">
                              </span>
                            </div>
                        </a>

                        <div class=" dropdown-header noti-title">
                            <h6 class="text-overflow m-0">{{ $t('welcome')  }}</h6>
                        </div>
                        <router-link to="/KontoOverview" class="dropdown-item">
                            <i class="ni ni-single-02"></i>
                            <span>{{ $t('site.overview.account_overview')}}</span>
                        </router-link>
                        <router-link to="/profile" class="dropdown-item">
                            <i class="ni ni-single-02"></i>
                            <span>{{ $t('site.navbar.my-profil')}}</span>
                        </router-link>
                        <router-link to="/profileedit" class="dropdown-item">
                            <i class="ni ni-settings-gear-65"></i>
                            <span>{{ $t('site.navbar.settings') }}</span>
                        </router-link>
                        <router-link to="/activity" class="dropdown-item">
                            <i class="ni ni-calendar-grid-58"></i>
                            <span>{{ $t('site.navbar.activity') }}</span>
                        </router-link>
                        <router-link to="/profile" class="dropdown-item">
                            <i class="ni ni-support-16"></i>
                            <span>{{ $t('site.navbar.support') }}</span>
                        </router-link>
                        <div class="dropdown-divider"></div>
                        <a href="#!" class="dropdown-item" @click="logout">
                            <i class="ni ni-user-run"></i>
                            <span>{{ $t('logout') }}</span>
                        </a>
                    </base-dropdown>
                </ul>
            </slot>
            <slot></slot>
            <div v-show="$sidebar.showSidebar" class="navbar-collapse collapse show" id="sidenav-collapse-main">

                <div class="navbar-collapse-header d-md-none">
                    <div class="row">
                        <div class="col-6 collapse-brand">
                            <router-link to="/">
                                <img :src="logo">
                            </router-link>
                        </div>
                        <div class="col-6 collapse-close">
                            <navbar-toggle-button @click.native="closeSidebar"></navbar-toggle-button>
                        </div>
                    </div>
                </div>

                <ul class="navbar-nav">
                    <slot name="links">
                    </slot>
                </ul>
                <!--Divider-->
                <hr class="my-3">
                <!--Heading-->
                <h6 class="navbar-heading text-muted">{{ $t('site.sidebar.community') }}</h6>
                <!--Navigation-->
                <ul class="navbar-nav mb-md-3">
                    <li class="nav-item">
                        <a class="nav-link"
                           href="https://gradido.net/de/">
                            <i class="ni ni-spaceship"></i> Gradido.net
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link"
                           href="https://elopage.com/s/gradido/sign_in">
                            <i class="ni ni-palette"></i> {{ $t('site.sidebar.members_area') }}
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link"
                           href="https://gradido.net/de/memberships/">
                            <i class="ni ni-ui-04"></i> {{ $t('site.sidebar.membership') }}
                        </a>
                    </li>
                </ul>
                 <!--Divider-->
                <hr class="my-3">
                  <!--Heading-->
                <h6 class="navbar-heading text-muted">{{ $t('site.sidebar.language') }}</h6>
                <!--Navigation-->
                <ul class="navbar-nav mb-md-3">
                    <li class="nav-item">
                        <div class="nav-link"  @click.prevent="setLocale('en')">
                          <i class="ni ni-ui-04"></i> English</div>
                    </li>
                    <li class="nav-item">
                        <div class="nav-link" @click.prevent="setLocale('de')">
                          <i class="ni ni-ui-04"></i> Deutsch</div>
                    </li>
                     
                </ul>

            </div>
            </div>
    </nav>
</template>
<script>
  import NavbarToggleButton from '@/components/NavbarToggleButton'

  export default {
    name: 'sidebar',
    components: {
      NavbarToggleButton
    },
    props: {
      logo: {
        type: String,
        default: 'img/brand/green.png',
        description: 'Sidebar app logo'
      },
      autoClose: {
        type: Boolean,
        default: true,
        description: 'Whether sidebar should autoclose on mobile when clicking an item'
      }
    },
    provide() {
      return {
        autoClose: this.autoClose
      };
    },
    methods: {
      closeSidebar() {
        this.$sidebar.displaySidebar(false)
      },
      showSidebar() {
        this.$sidebar.displaySidebar(true)
      },
      setLocale(locale) {
      this.$i18n.locale = locale
      //this.$router.push({
      //  params: { lang: locale }
      //})
      //this.hideDropdown()
    },
    logout(){
      //console.log("DashboardNavbar.vue user logout() : ")
      this.$store.dispatch('logout')
    }  
    },
    beforeDestroy() {
      if (this.$sidebar.showSidebar) {
        this.$sidebar.showSidebar = false;
      }
    }
  };
</script>
