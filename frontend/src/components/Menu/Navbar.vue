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
          <!-- The calculator sits ABOVE the menu opener, deliberately small and unmarked:
               it is a tool for those who run a till, not a headline feature. Whoever needs
               it knows where it lives. (Bernd, 20.08.2026) -->
          <div class="d-block d-lg-none">
            <router-link
              to="/calculator"
              class="calculator-quick"
              :aria-label="$t('navigation.calculator')"
              data-test="navbar-calculator"
            >
              <i-mdi-calculator />
            </router-link>
            <div v-b-toggle.sidebar-mobile variant="link">
              <span class="navbar-toggler-icon h2"></span>
            </div>
          </div>
        </BNavbarBrand>

        <BImg class="sheet-img position-absolute zindex-1" :src="sheet"></BImg>

        <BNavbarNav class="ms-auto" right>
          <div class="">
            <div class="d-flex flex-column align-items-end text-end">
              <!-- The avatar opens the picture tool; the settings link moved to the name
                   below it. That name already carried the link colouring but was not a
                   link at all, so the move turns a decoy into a function. -->
              <div class="ms-auto">
                <AvatarButton
                  class="vue3-avatar"
                  :name="username.username"
                  :initials="username.initials"
                  :color="'#fff'"
                  :size="61"
                />
              </div>
              <router-link
                to="/settings"
                class="navbar-like-link mt-3"
                data-test="navbar-item-username"
              >
                {{ username.username }}
              </router-link>
              <!-- One line for everybody. There used to be two blocks, and the one for
                   members without a user name showed the address inside the settings link,
                   with no way to copy it. That distinction is on its way out anyway -- the
                   user name is becoming compulsory -- and until then the Gradido ID stands
                   in, which resolves just as well. -->
              <div
                class="small navbar-like-link pointer mt-1"
                data-test="navbar-item-gradido-address"
              >
                <!-- The control itself moved into its own component when the public profile
                     page became the second place that shows the address. It is a button and
                     not an anchor: an anchor without a target is in no tab order, so the
                     address was unreachable for anybody working without a mouse. -->
                <gradido-address-copy :alias="alias" />
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
import { memberAlias } from '@/utils/gradidoAddress'
import GradidoAddressCopy from '@/components/GradidoAddressCopy'

export default {
  name: 'Navbar',
  components: {
    GradidoAddressCopy,
  },
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
    alias() {
      // gradidoID, not gradidoId -- the store spells it with a capital D, and the other
      // spelling once put the word "undefined" in front of every member without a user
      // name. It is worth naming at each call site; nothing catches it.
      return memberAlias(this.$store.state.username, this.$store.state.gradidoID)
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

/* Small to the eye, 44px to the thumb -- same rule as the gear inside the calculator. */
.calculator-quick {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 22px;
  color: inherit;
  opacity: 0.65;
}

.calculator-quick:hover {
  color: inherit;
  opacity: 1;
}
</style>

<style scoped>
:deep(.container-fluid) {
  padding: 0 !important;
}
</style>
