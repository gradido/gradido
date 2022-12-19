<template>
  <div id="component-sidebar">
    <div id="side-menu" ref="sideMenu" class="gradido-border-radius appBoxShadow pt-2">
      <!-- @mouseout="$emit('toogleMobilMenu')" -->
      <div class="mb-6 mt-3">
        <b-nav vertical class="w-200">
          <b-nav-item to="/overview" class="mb-3" active-class="activeRoute">
            <b-icon icon="house" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.overview') }}</span>
          </b-nav-item>
          <!-- <b-nav-item to="/storys" class="mb-3">
            <b-icon icon="card-heading" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.topStories') }}</span>
          </b-nav-item> -->
          <!-- <b-nav-item to="/addresses" class="mb-3">
            <b-icon icon="bookmark" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.adresses') }}</span>
          </b-nav-item> -->

          <b-nav-item to="/send" class="mb-3" active-class="activeRoute">
            <b-icon icon="cash-stack" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.send') }}</span>
          </b-nav-item>
          <b-nav-item to="/transactions" class="mb-3" active-class="activeRoute">
            <b-icon icon="layers" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.transactions') }}</span>
          </b-nav-item>
          <b-nav-item to="/gdt" class="mb-3" active-class="activeRoute">
            <b-icon icon="layers" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('gdt.gdt') }}</span>
          </b-nav-item>
          <!-- <b-nav-item to="/profile" class="mb-3 HIDE_FOR_WORK_IN_PROCESS">
            <b-icon icon="person" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.profile') }}</span>
          </b-nav-item> -->
          <b-nav-item to="/community#my" class="mb-3" active-class="activeRoute">
            <b-icon icon="people" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('creation') }}</span>
          </b-nav-item>
        </b-nav>
        <hr />
        <b-nav vertical class="w-100">
          <b-nav-item to="/information" class="mb-3" active-class="activeRoute">
            <b-icon icon="info-circle" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.info') }}</span>
          </b-nav-item>
          <!-- <b-nav-item
            @click="
              lightmode = !lightmode
              $emit('modeToggle')
            "
            class="mb-3 HIDE_FOR_WORK_IN_PROCESS"
          >
            <b-icon :icon="lightmode ? 'toggle-on' : 'toggle-off'" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.lightmode') }}</span>
            <label for="checkbox" class="switch-label">
              <span v-if="lightmode">{{ $t('navigation.moon') }}</span>
              <span v-else>{{ $t('navigation.sun') }}</span>
            </label>
          </b-nav-item> -->
          <b-nav-item to="/settings" class="mb-3" active-class="activeRoute">
            <b-icon icon="gear" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.settings') }}</span>
          </b-nav-item>
          <b-nav-item
            class="mb-3 text-light"
            v-if="$store.state.isAdmin"
            @click="$emit('admin')"
            active-class="activeRoute"
          >
            <b-icon icon="shield-check" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('navigation.admin_area') }}</span>
          </b-nav-item>
          <b-nav-item
            class="mb-3 font-weight-bold"
            @click="$emit('logout')"
            active-class="activeRoute"
          >
            <b-icon icon="power" aria-hidden="true" variant="danger"></b-icon>
            <span class="ml-2 text-danger">{{ $t('navigation.logout') }}</span>
          </b-nav-item>
        </b-nav>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Sidebar',
  data() {
    return {
      // lightmode: false,
    }
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

/* .component-navbar .active, */
/* #component-sidebar .active {
  font-weight: bold;
  color: red;
} */
#component-sidebar {
  min-width: 200px;
}

@media screen and (max-width: 1024px) {
  #side-menu {
    max-width: 100%;
  }
  #component-sidebar {
    max-width: 100%;
  }
}
</style>
