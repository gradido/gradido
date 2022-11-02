<template>
  <div id="component-sidebar">
    <div class="pl-lg-1 gradido-border-radius bg-white shadow-default pt-2 mt-4">
      <p></p>
      <div class="mb-6">
        <b-nav vertical class="w-200">
          <b-nav-item to="/overview" class="mb-3">
            <b-icon icon="house" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.overview') }}</span>
          </b-nav-item>
          <b-nav-item to="/storys" class="mb-3">
            <b-icon icon="card-heading" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.top_stories') }}</span>
          </b-nav-item>
          <b-nav-item to="/favourites" class="mb-3">
            <b-icon icon="bookmark" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.favourites') }}</span>
          </b-nav-item>

          <b-nav-item to="/send" class="mb-3">
            <b-icon icon="arrow-left-right" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.send') }}</span>
          </b-nav-item>
          <b-nav-item to="/transactions" class="mb-3">
            <b-icon icon="layout-text-sidebar-reverse" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.transactions') }}</span>
          </b-nav-item>
          <b-nav-item to="/profile" class="mb-3">
            <b-icon icon="person" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.profile') }}</span>
          </b-nav-item>
          <b-nav-item to="/community" class="mb-3">
            <b-icon icon="people" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.members') }}</span>
          </b-nav-item>
        </b-nav>
        <hr />
        <b-nav vertical class="w-100">
          <b-nav-item
            @click="
              lightmode = !lightmode
              $emit('modeToggle')
            "
            class="mb-3"
          >
            <b-icon :icon="lightmode ? 'toggle-on' : 'toggle-off'" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.lightmode') }}</span>
            <label for="checkbox" class="switch-label">
              <span v-if="lightmode">🌙</span>
              <span v-else>☀️</span>
            </label>
          </b-nav-item>
          <b-nav-item to="/settings" class="mb-3">
            <b-icon icon="gear" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.settings') }}</span>
          </b-nav-item>
          <b-nav-item class="mb-3" v-if="$store.state.isAdmin" @click="$emit('admin')">
            <b-icon icon="shield-check" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.admin_area') }}</span>
          </b-nav-item>
          <b-nav-item class="mb-3" @click="$emit('logout')">
            <b-icon icon="power" aria-hidden="true"></b-icon>
            <span class="d-none d-lg-inline ml-2">{{ $t('navigation.logout') }}</span>
          </b-nav-item>
        </b-nav>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'sidebar',
  data() {
    return {
      lightmode: false,
    }
  },
}
</script>
<style>
.component-navbar .active,
#component-sidebar .active {
  font-weight: bold;
}
#component-sidebar {
  min-width: 53px;
  max-width: 200px;
}
</style>
