<template>
  <div class="navbar-component">
    <div class="navbar-element">
      <BNavbar toggleable="lg" class="pe-4">
        <BNavbarBrand>
          <BImg
            class="mt-lg--2 mt-3 mb-3 d-none d-lg-block zindex10"
            :src="logo"
            width="200"
            alt="Logo"
          />
          <div v-b-toggle.sidebar-mobile variant="link" class="d-block d-lg-none">
            <span class="navbar-toggler-icon h2"></span>
          </div>
        </BNavbarBrand>

        <BImg class="sheet-img position-absolute zindex-1" :src="sheet"></BImg>

        <BNavbarNav class="ms-auto" right>
          <router-link to="/settings">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <app-avatar
                  class="vue3-avatar"
                  :name="username.username"
                  :initials="username.initials"
                  :border="false"
                  :color="'#fff'"
                  :size="61"
                />
              </div>
              <div>
                <div data-test="navbar-item-username">{{ username.username }}</div>
                <div data-test="navbar-item-email">{{ $store.state.email }}</div>
              </div>
            </div>
          </router-link>
        </BNavbarNav>
      </BNavbar>
      <!-- <div class="alert-box">
      <b-alert show dismissible variant="light" class="nav-alert text-dark">
        <small>{{ $t('1000thanks') }}</small>
      </b-alert>
    </div> -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'Navbar',
  props: {
    balance: { type: Number, required: true },
  },
  data() {
    return {
      logo: '/img/brand/gradido-logo.png',
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

.navbar-toggler {
  font-size: 2.25rem;
}

button.navbar-toggler > span.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(4, 112, 6, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

.sheet-img {
  top: -11px;
  left: 50%;
  max-width: 64%;
}

.alert-box {
  left: 20%;
  right: 20%;
  position: absolute;
  z-index: 1000;
  top: 25px;
}

@media screen and (width <= 1170px) {
  .sheet-img {
    left: 20%;
  }

  .alert-box {
    position: static;
    margin-left: 5%;
    margin-right: 5%;
    z-index: 0;
  }
}

@media screen and (width <= 450px) {
  .navbar-element {
    z-index: 1000;
    position: fixed;
    background-color: #f5f5f5e6;
    left: 0;
    right: 0;
  }

  .sheet-img {
    left: 5%;
    max-width: 61%;
  }
}
</style>

<style scoped>
:deep(.container-fluid) {
  padding: 0 !important;
}
</style>
