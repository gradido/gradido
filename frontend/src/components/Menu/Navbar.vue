<template>
  <div class="navbar-component">
    <div class="navbar-element">
      <BNavbar toggleable="lg" class="pe-4">
        <BNavbarBrand>
          <router-link to="/overview">
            <BImg
              class="mt-lg--2 mt-3 mb-3 d-none d-lg-block zindex10"
              :src="logo"
              width="200"
              alt="Logo"
            />
          </router-link>
          <div v-b-toggle.sidebar-mobile variant="link" class="d-block d-lg-none">
            <span class="navbar-toggler-icon h2"></span>
          </div>
        </BNavbarBrand>

        <BImg class="sheet-img position-absolute zindex-1" :src="sheet"></BImg>

        <BNavbarNav class="ms-auto" right>
          <div class="">
            <router-link to="/settings" class="d-flex flex-column align-items-end text-end">
              <div class="ms-auto">
                <app-avatar
                  class="vue3-avatar"
                  :name="username.username"
                  :initials="username.initials"
                  :border="false"
                  :color="'#fff'"
                  :size="61"
                />
              </div>
              <div v-if="!hasUsername">
                <div class="mt-3" data-test="navbar-item-username">{{ username.username }}</div>
                <div class="small mt-1" data-test="navbar-item-gradido-id">{{ gradidoId }}</div>
              </div>
            </router-link>
            <div class="d-flex flex-column align-items-end text-end">
              <div
                v-if="hasUsername"
                class="navbar-like-link mt-3"
                data-test="navbar-item-username"
              >
                {{ username.username }}
              </div>
              <div
                v-if="hasUsername"
                class="small navbar-like-link pointer mt-1"
                data-test="navbar-item-gradido-id"
              >
                <a
                  class="copy-clipboard-button"
                  :title="$t('copy-to-clipboard')"
                  @click="copyToClipboard(gradidoId)"
                >
                  <IBiCopy></IBiCopy>
                  {{ gradidoId }}
                </a>
              </div>
            </div>
          </div>
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
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'

export default {
  name: 'Navbar',
  props: {
    balance: { type: Number, required: true },
  },
  setup() {
    const toast = useAppToast()
    return {
      toast,
    }
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
    hasUsername() {
      return this.$store.state.username && this.$store.state.username.length > 0
    },
    gradidoId() {
      const name = this.$store.state.username
        ? this.$store.state.username
        : this.$store.state.gradidoId
      return `${CONFIG.COMMUNITY_NAME}/${name}`
    },
  },
  methods: {
    copyToClipboard(content) {
      navigator.clipboard.writeText(content)
      this.toast.toastSuccess(this.$t('gradidoid-copied-to-clipboard'))
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

.navbar-like-link {
  color: rgba(var(--bs-link-color-rgb));
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
