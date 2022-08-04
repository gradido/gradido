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
          <b-nav-item to="/community" class="mb-3">
            <b-icon icon="people" aria-hidden="true"></b-icon>
            {{ $t('navigation.community') }}
          </b-nav-item>
          <b-nav-item to="/profile" class="mb-3">
            <b-icon icon="gear" aria-hidden="true"></b-icon>
            {{ $t('navigation.profile') }}
          </b-nav-item>
        </b-nav>
        <hr />
        <b-nav vertical class="w-100">
          <b-nav-item
            v-if="$store.state.hasElopage"
            class="mb-3"
            :href="elopageUri"
            target="_blank"
          >
            <b-icon icon="link45deg" aria-hidden="true"></b-icon>
            {{ $t('navigation.members_area') }}
          </b-nav-item>
          <b-nav-item class="mb-3" v-if="$store.state.isAdmin" @click="$emit('admin')">
            <b-icon icon="shield-check" aria-hidden="true"></b-icon>
            {{ $t('navigation.admin_area') }}
          </b-nav-item>
          <b-nav-item to="/community" class="mb-3">
            <b-icon icon="people" aria-hidden="true"></b-icon>
            {{ $t('community.community') }}
          </b-nav-item>
          <b-nav-item class="mb-3" @click="$emit('logout')">
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
  props: {
    elopageUri: {
      type: String,
      required: false,
    },
  },
}
</script>
<style>
.component-navbar .active,
#component-sidebar .active {
  font-weight: bold;
}
</style>
