<template>
  <div class="auth-header position-sticky">
    <b-navbar toggleable="lg" class="pr-4">
      <b-navbar-brand>
        <b-img
          class="imgLogo ml--3 mt-lg--2 mt-3 p-2 mb-3 zindex1000 d-none d-lg-block"
          :src="logo"
          width="200"
          alt="..."
        />
        <b-button v-b-toggle.sidebar-1 class="d-block d-lg-none">
          <span class="navbar-toggler-icon"></span>
        </b-button>
      </b-navbar-brand>
      <b-img class="sheet-img position-absolute zindex1000" :src="sheet"></b-img>

      <b-collapse id="nav-collapse" is-nav class="ml-5">
        <b-navbar-nav class="ml-auto" right>
          <div class="mb-2">
            <router-link to="/profile">
              <div>
                <div class="d-flex">
                  <div class="mr-3">
                    <b-avatar
                      button
                      variant="primary"
                      :text="avatarShortName"
                      class="align-baseline"
                    ></b-avatar>
                  </div>
                  <div>
                    <div class="small">{{ avatarLongName }}</div>

                    <div class="text-right small">
                      <small>{{ $store.state.email }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <!-- <div class="alertBox">
      <b-alert show dismissible variant="light" class="nav-alert text-dark">
        <small>{{ $t('1000thanks') }}</small>
      </b-alert>
    </div> -->
  </div>
</template>

<script>
export default {
  name: 'AuthNavbar',
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
    avatarShortName() {
      return this.$store.state.firstName[0] + this.$store.state.lastName[0]
    },
    avatarLongName() {
      return `${this.$store.state.firstName} ${this.$store.state.lastName}`
    },
  },
}
</script>

<style lang="scss">
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
    left: 40%;
  }
  .alertBox {
    position: static;
    margin-left: 5%;
    margin-right: 5%;
    z-index: 0;
  }
}
@media screen and (max-width: 450px) {
  .sheet-img {
    top: -15px;
    left: 10%;
    max-width: 61%;
  }
}
</style>
