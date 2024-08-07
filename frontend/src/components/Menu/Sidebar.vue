<template>
  <div id="component-sidebar">
    <div
      id="side-menu"
      ref="sideMenu"
      class="gradido-border-radius pt-2 bg-white"
      :class="shadow ? 'appBoxShadow' : ''"
    >
      <div class="mb-3 mt-3">
        <BNav vertical class="w-200">
          <BNavItem to="/overview" class="mb-3" active-class="activeRoute">
            <BImg src="/img/svg/home.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.overview') }}</span>
          </BNavItem>
          <BNavItem to="/send" class="mb-3" active-class="activeRoute">
            <b-icon icon="cash" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.send') }}</span>
          </BNavItem>
          <BNavItem to="/transactions" :class="transactionClass" active-class="activeRoute">
            <BImg src="/img/svg/transaction.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.transactions') }}</span>
          </BNavItem>
          <BNavItem to="/community" class="mb-3" active-class="activeRoute">
            <BImg src="/img/svg/community.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('creation') }}</span>
          </BNavItem>
          <BNavItem to="/information" class="mb-3" active-class="activeRoute">
            <BImg src="/img/svg/info.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.info') }}</span>
          </BNavItem>
          <BNavItem to="/circles" v-if="isHumhub" class="mb-3" active-class="activeRoute">
            <BImg src="/img/svg/circles.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.circles') }}</span>
          </BNavItem>
          <BNavItem to="/usersearch" v-if="isGMS" active-class="activeRoute">
            <BImg src="/img/loupe.png" height="20" />
            <span class="ml-2">{{ $t('navigation.usersearch') }}</span>
          </BNavItem>
        </BNav>
        <hr class="m-3" />
        <BNav vertical class="w-100">
          <BNavItem
            to="/settings"
            class="mb-3"
            active-class="activeRoute"
            data-test="settings-menu"
          >
            <BImg src="/img/svg/settings.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.settings') }}</span>
            <BBadge v-if="!$store.state.username" variant="warning">
              {{ $t('settings.newSettings') }}
            </BBadge>
          </BNavItem>
          <BNavItem
            class="mb-3 text-light"
            v-if="$store.state.roles && $store.state.roles.length > 0"
            @click="$emit('admin')"
            active-class="activeRoute"
          >
            <b-icon icon="shield-check" aria-hidden="true"></b-icon>
            <span class="ml-2">
              {{ $t('navigation.admin_area') }}
            </span>
          </BNavItem>
          <BNavItem
            class="font-weight-bold"
            @click="$emit('logout')"
            active-class="activeRoute"
            data-test="logout-menu"
          >
            <BImg src="/img/svg/logout.svg" height="20" class="svg-icon" />
            <span class="ml-2 text-205">{{ $t('navigation.logout') }}</span>
          </BNavItem>
        </BNav>
      </div>
    </div>
  </div>
</template>
<script>
import CONFIG from '../../config'

export default {
  name: 'Sidebar',
  props: {
    shadow: { type: Boolean, required: false, default: true },
  },
  computed: {
    transactionClass() {
      if (this.$route.path === '/gdt') {
        return 'mb-3 activeRoute'
      }
      return 'mb-3'
    },
    isHumhub() {
      // return true
      return CONFIG.HUMHUB_ACTIVE === 'true'
    },
    isGMS() {
      return CONFIG.GMS_ACTIVE === 'true'
    },
  },
}
</script>
<style>
.nav-link {
  color: rgb(56, 56, 56);
}
.activeRoute {
  font-weight: bold;
  color: rgb(2, 2, 1);
  border-left: 4px rgb(219, 129, 19) solid;
}
.svg-icon {
  filter: brightness(1) invert(0);
}

.activeRoute .svg-icon {
  filter: brightness(0) invert(0);
}

#component-sidebar {
  min-width: 200px;
}
@media screen and (min-width: 1025px) {
  #side-menu {
    max-width: 180px;
  }
  #component-sidebar {
    min-width: 180px;
  }
}
/*
@media screen and (min-width: 1075px) {
  #side-menu {
    max-width: 200px;
  }
  #component-sidebar {
    min-width: 200px;
  }
}
@media screen and (max-width: 1108px) {
  #side-menu {
    max-width: 100%;
  }
  #component-sidebar {
    max-width: 100%;
  }
} */
</style>
