<template>
  <div class="navbar-component">
    <div class="navbar-element">
      <b-navbar toggleable="lg" class="pr-4">
        <b-navbar-brand>
          <b-img
            class="imgLogo mt-lg--2 mt-3 mb-3 d-none d-lg-block zindex10"
            :src="logo"
            width=""
            alt="..."
          />
          <div v-b-toggle.sidebar-mobile variant="link" class="d-block d-lg-none">
            <span class="navbar-toggler-icon h2"></span>
          </div>
        </b-navbar-brand>

        <b-img class="sheet-img position-absolute zindex-1" :src="sheet"></b-img>

        <b-navbar-nav class="ml-auto" right>
          <router-link to="/settings">
            <div class="d-flex align-items-center">
              <div class="mr-3">
                <avatar
                  :username="username.username"
                  :initials="username.initials"
                  :color="'#fff'"
                  :size="61"
                ></avatar>
              </div>
              <div>
                <div data-test="navbar-item-username">{{ username.username }}</div>

                <div data-test="navbar-item-email">
                  {{ $store.state.email }}
                </div>
              </div>
            </div>
          </router-link>
        </b-navbar-nav>
      </b-navbar>
      <!-- <div class="alertBox">
      <b-alert show dismissible variant="light" class="nav-alert text-dark">
        <small>{{ $t('1000thanks') }}</small>
      </b-alert>
    </div> -->
    </div>
  </div>
</template>

<script>
import Avatar from 'vue-avatar'

export default {
  name: 'Navbar',
  components: {
    Avatar,
  },
  props: {
    balance: { type: Number, required: true },
  },
  data() {
    return {
      logo: '/img/brand/green.png',
      sheet: '/img/template/Blaetter.png',
    }
  },
  computed: {
    username() {
      return {
        username: `${this.$store.state.firstName} ${this.$store.state.lastName}`,
        initials: `${this.$store.state.firstName[0]}${this.$store.state.lastName[0]}`,
      }
    },
  },
}
</script>

<style lang="scss">
.navbar-element {
  position: sticky;
}

.auth-header {
  font-family: 'Open Sans', sans-serif !important;
  height: 150px;
}

.authNavbar > .nav-link {
  color: #383838 !important;
}

.navbar-toggler {
  font-size: 2.25rem;
}

.authNavbar > .router-link-exact-active {
  color: #0e79bc !important;
}

button.navbar-toggler > span.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(4, 112, 6, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

.sheet-img {
  top: -11px;
  left: 50%;
  max-width: 64%;
}
.alertBox {
  left: 20%;
  right: 20%;
  position: absolute;
  z-index: 1000;
  top: 25px;
}
@media screen and (max-width: 1170px) {
  .sheet-img {
    left: 20%;
  }
  .alertBox {
    position: static;
    margin-left: 5%;
    margin-right: 5%;
    z-index: 0;
  }
}
@media screen and (max-width: 450px) {
  .navbar-element {
    z-index: 1000;
    position: fixed;
    width: 100%;
    background-color: #f5f5f5e6;
  }
  .sheet-img {
    left: 5%;
    max-width: 61%;
  }
}
</style>
