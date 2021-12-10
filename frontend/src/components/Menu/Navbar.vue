<template>
  <div class="component-navbar" style="background-color: #fff">
    <b-navbar toggleable="lg" type="light" variant="faded">
      <div class="navbar-brand">
        <b-navbar-nav>
          <b-nav-item to="/overview">
            <img :src="logo" class="navbar-brand-img" alt="..." />
          </b-nav-item>
        </b-navbar-nav>
      </div>
      <b-nav-text center>{{ balance }} GDD</b-nav-text>
      <b-navbar-toggle
        target=""
        @click="$emit('set-visible', (visibleCollapse = !visible))"
      ></b-navbar-toggle>
    </b-navbar>
    <b-collapse id="collapse-4" v-model="visibleCollapse" class="p-3 b-collaps-gradido">
      <b-nav vertical @click="$emit('setVisible', false)">
        <b-nav-item to="/overview" class="mb-3">
          {{ $t('overview') }}
        </b-nav-item>
        <b-nav-item to="/send" class="mb-3">{{ $t('send') }}</b-nav-item>
        <b-nav-item to="/transactions" class="mb-3">
          {{ $t('transactions') }}
        </b-nav-item>
        <b-nav-item to="/profile" class="mb-3">
          {{ $t('site.navbar.my-profil') }}
        </b-nav-item>
        <br />
        <b-nav-item class="mb-3" @click="$emit('getElopageLink')">
          {{ $t('members_area') }}
          <b-badge v-if="!$store.state.hasElopage" pill variant="danger">!</b-badge>
        </b-nav-item>
        <b-nav-item class="mb-3" v-if="$store.state.isAdmin" @click="$emit('admin')">
          {{ $t('admin_area') }}
        </b-nav-item>
        <b-nav-item class="mb-3" @click="$emit('logout')">{{ $t('logout') }}</b-nav-item>
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
  box-shadow: cadetblue 0px 13px 22px;
}
</style>
