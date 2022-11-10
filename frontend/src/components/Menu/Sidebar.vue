<template>
  <div id="component-sidebar">
    <div class="pl-3">
      <p></p>
      <div class="mb-6">
        <b-nav vertical class="w-200">
          <b-nav-item to="/overview" class="mb-3">
            <b-icon icon="house" aria-hidden="true"></b-icon>
            {{ $t('navigation.overview') }}
          </b-nav-item>
          <b-nav-item to="/send" class="mb-3">
            <b-icon icon="arrow-left-right" aria-hidden="true"></b-icon>
            {{ $t('navigation.send') }}
          </b-nav-item>
          <b-nav-item to="/transactions" class="mb-3">
            <b-icon icon="layout-text-sidebar-reverse" aria-hidden="true"></b-icon>
            {{ $t('navigation.transactions') }}
          </b-nav-item>
          <b-nav-item to="/gdt" class="mb-3">
            <b-icon icon="layout-text-sidebar-reverse" aria-hidden="true"></b-icon>
            {{ $t('gdt.gdt') }}
          </b-nav-item>
          <b-nav-item to="/community" class="mb-3">
            <b-icon icon="people" aria-hidden="true"></b-icon>
            {{ $t('navigation.community') }}
          </b-nav-item>
          <b-nav-item to="/profile" class="mb-3" data-test="profile-menu">
            <b-icon icon="gear" aria-hidden="true"></b-icon>
            {{ $t('navigation.profile') }}
          </b-nav-item>
          <b-nav-item to="/information" class="mb-3">
            <b-icon icon="info-circle" aria-hidden="true"></b-icon>
            {{ $t('navigation.info') }}
          </b-nav-item>
        </b-nav>
        <hr />
        <b-nav vertical class="w-100">
          <b-nav-item class="mb-3" v-if="$store.state.isAdmin" @click="$emit('admin')">
            <b-icon icon="shield-check" aria-hidden="true"></b-icon>
            {{ $t('navigation.admin_area') }}
          </b-nav-item>
          <b-nav-item class="mb-3" @click="$emit('logout')" data-test="logout-menu">
            <b-icon icon="power" aria-hidden="true"></b-icon>
            {{ $t('navigation.logout') }}
          </b-nav-item>
        </b-nav>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'sidebar',
}
</script>
<style>
.component-navbar .active,
#component-sidebar .active {
  font-weight: bold;
}
</style>
