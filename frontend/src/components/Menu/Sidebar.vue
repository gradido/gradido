<template>
  <div id="component-sidebar">
    <div
      id="side-menu"
      ref="sideMenu"
      class="gradido-border-radius pt-2 bg-white"
      :class="shadow ? 'appBoxShadow' : ''"
    >
      <div class="mb-3 mt-3">
        <b-nav vertical class="w-200">
          <b-nav-item to="/overview" class="mb-3" active-class="activeRoute">
            <b-img src="/img/svg/home.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.overview') }}</span>
          </b-nav-item>
          <b-nav-item to="/send" class="mb-3" active-class="activeRoute">
            <b-img src="/img/svg/send.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.send') }}</span>
          </b-nav-item>
          <b-nav-item to="/transactions" class="mb-3" active-class="activeRoute">
            <b-img src="/img/svg/transaction.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.transactions') }}</span>
          </b-nav-item>
          <b-nav-item to="/community" class="mb-3" active-class="activeRoute">
            <b-img src="/img/svg/community.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('creation') }}</span>
          </b-nav-item>
          <b-nav-item to="/gdt" class="mb-3" active-class="activeRoute">
            <b-icon icon="layers" aria-hidden="true"></b-icon>
            <span class="ml-2">{{ $t('GDT') }}</span>
          </b-nav-item>
          <b-nav-item to="/information" active-class="activeRoute">
            <b-img src="/img/svg/info.svg" height="20" class="svg-icon" />
            <span class="ml-2">{{ $t('navigation.info') }}</span>
          </b-nav-item>
        </b-nav>
        <hr class="m-3" />
        <b-nav vertical class="w-100">
          <b-nav-item to="/settings" class="mb-3" active-class="activeRoute">
            <b-img src="/img/svg/settings.svg" height="20" class="svg-icon" />
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
          <b-nav-item class="font-weight-bold" @click="$emit('logout')" active-class="activeRoute">
            <b-img src="/img/svg/logout.svg" height="20" class="svg-icon" />
            <span class="ml-2 text-205">{{ $t('navigation.logout') }}</span>
          </b-nav-item>
        </b-nav>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Sidebar',
  props: {
    shadow: { type: Boolean, required: false, default: true },
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
