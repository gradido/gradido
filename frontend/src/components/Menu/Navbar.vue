<template>
  <div class="component-navbar">
    <b-navbar toggleable="lg" type="light" variant="faded">
      <div class="navbar-brand">
        <b-navbar-nav @click="$emit('set-visible', false)">
          <b-nav-item to="/overview">
            <img :src="logo" class="navbar-brand-img" alt="..." />
          </b-nav-item>
        </b-navbar-nav>
      </div>

      <b-navbar-nav class="ml-auto" is-nav>
        <b-nav-item>
          <b-icon v-if="pending" icon="three-dots" animation="cylon"></b-icon>
          <div v-else>{{ pending ? $t('em-dash') : balance | amount }} {{ $t('GDD') }}</div>
        </b-nav-item>
        <b-nav-item to="/profile" right class="d-none d-sm-none d-md-none d-lg-flex shadow-lg">
          <small>
            {{ $store.state.firstName }} {{ $store.state.lastName }}
            <b>{{ $store.state.email }}</b>
            <b-icon class="ml-3" icon="gear-fill" aria-hidden="true"></b-icon>
          </small>
        </b-nav-item>
      </b-navbar-nav>

      <b-navbar-toggle
        target="false"
        @click="$emit('set-visible', (visibleCollapse = !visible))"
      ></b-navbar-toggle>
    </b-navbar>

    <b-collapse id="collapse-nav" v-model="visibleCollapse" class="p-3 b-collaps-gradido">
      <b-nav vertical @click="$emit('set-visible', false)">
        <div class="text-right">
          <b-link to="/profile">
            <small>
              {{ $store.state.firstName }}
              {{ $store.state.lastName }}
              <b>{{ $store.state.email }}</b>
            </small>
          </b-link>
        </div>
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
        <b-nav-item to="/profile" class="mb-3">
          <b-icon icon="gear" aria-hidden="true"></b-icon>
          {{ $t('navigation.profile') }}
        </b-nav-item>
        <b-nav-item to="/info" class="mb-3">
          <b-icon icon="info-circle" aria-hidden="true"></b-icon>
          {{ $t('navigation.info') }}
        </b-nav-item>
        <br />
        <b-nav-item v-if="$store.state.hasElopage" :href="elopageUri" class="mb-3" target="_blank">
          <b-icon icon="link45deg" aria-hidden="true"></b-icon>
          {{ $t('navigation.members_area') }}
        </b-nav-item>
        <b-nav-item class="mb-3" v-if="$store.state.isAdmin" @click="$emit('admin')">
          <b-icon icon="shield-check" aria-hidden="true"></b-icon>
          {{ $t('navigation.admin_area') }}
        </b-nav-item>
        <b-nav-item class="mb-3" @click="$emit('logout')">
          <b-icon icon="power" aria-hidden="true"></b-icon>
          {{ $t('navigation.logout') }}
        </b-nav-item>
      </b-nav>
    </b-collapse>
  </div>
</template>
<script>
export default {
  name: 'navbar',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
    elopageUri: {
      type: String,
      required: false,
    },
    pending: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      logo: 'img/brand/green.png',
      visibleCollapse: this.visible,
    }
  },
  watch: {
    visible() {
      this.visibleCollapse = this.visible
    },
  },
}
</script>
<style>
.b-collaps-gradido {
  position: absolute;
  z-index: 100000;
  background-color: #dfe0e3f5;
  width: 100%;
  box-shadow: #b4b4b4 0px 13px 22px;
  font-size: large;
}
.b-collaps-gradido li :hover {
  background-color: #e9e7e7f5;
}
</style>
