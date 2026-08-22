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
          <!-- The four till tools sit ABOVE the menu opener, deliberately small and
               unmarked: tools for those who run a till, not headline features. Whoever
               needs them knows where they live. Scan left of the calculator, because
               scanning is the more general act. (Bernd, 20./21.08.2026)

               ⛔ Two by two, NOT four in a row. Four 44px targets need 176px, and the
               block opposite -- avatar, name and the Gradido address at 27 characters --
               takes about 195px of a 375px phone. There is room for three. The second row
               costs no height either: the brand block grows to about 128px and the block
               opposite is already about 130px tall.

               The rows mean something: reading a code above, showing one below. -->
          <div class="d-block d-lg-none">
            <div class="navbar-quick-row">
              <router-link
                to="/scan"
                :aria-label="$t('navigation.scanner')"
                data-test="navbar-scanner"
              >
                <i-mdi-qrcode-scan />
              </router-link>
              <router-link
                to="/calculator"
                :aria-label="$t('navigation.calculator')"
                data-test="navbar-calculator"
              >
                <i-mdi-calculator />
              </router-link>
              <router-link
                to="/my-thank-you-card"
                :aria-label="$t('pageTitle.my-thank-you-card')"
                data-test="navbar-my-thank-you-card"
              >
                <quick-code-icon direction="out" />
              </router-link>
              <router-link
                to="/my-gradido-card"
                :aria-label="$t('pageTitle.my-gradido-card')"
                data-test="navbar-my-gradido-card"
              >
                <quick-code-icon direction="in" />
              </router-link>
            </div>
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
import QuickCodeIcon from '@/components/Menu/QuickCodeIcon'

export default {
  name: 'Navbar',
  components: {
    GradidoAddressCopy,
    QuickCodeIcon,
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

/* Two columns of 44px, so the four tools stack two by two instead of pushing the block
   opposite off a narrow phone. */
.navbar-component .navbar-quick-row {
  display: grid;
  grid-template-columns: repeat(2, 44px);
}

/* Small to the eye, 44px to the thumb -- same rule as the gear inside the calculator.

   Written through the row rather than as one class per tool. This style block is GLOBAL,
   like DashboardLayout's, so a bare class name would style across components -- which is
   why there used to be two names for one look. A descendant of `.navbar-quick-row` cannot
   escape this component, and it does not grow a fifth name when a fifth tool arrives.

   ⛔ `flex-start`, NOT `center`, and that is what puts the block where it belongs. Centring
   a 22px glyph in a 44px target insets it by 11px, so the symbols stood a thumb's width
   right of the menu opener below them and the top-right one reached into the leaves. Left
   aligned, every glyph starts at the column edge -- the same edge the opener starts at,
   within about a pixel (both SVGs carry roughly 3px of their own padding). The touch
   targets and the spacing between the symbols are untouched; the whole block simply moves
   11px left. (Bernd, 21.08.2026: "sodass die linke Kante eine Linie bildet")

   The colour is the menu's own -- `--icon-muted`, which is what `svg.svg-icon` carries,
   rgb(114 119 143) in BOTH modes. ⚠️ Not `--text`: the menu items' text is near-black in
   light and near-white in dark, and the icons beside them are not. No opacity either --
   the tone has to MATCH the menu, and 0.65 of it is a different grey.
   (Bernd, 22.08.2026: "das ist so ein mittleres Grau, jeweils") */
.navbar-component .navbar-quick-row > a {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 44px;
  height: 44px;
  font-size: 22px;
  color: var(--icon-muted);
}

.navbar-component .navbar-quick-row > a:hover {
  color: var(--icon-muted);
  opacity: 0.7;
}
</style>

<style scoped>
:deep(.container-fluid) {
  padding: 0 !important;
}
</style>
