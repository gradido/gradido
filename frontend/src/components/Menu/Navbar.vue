<template>
  <div class="component-navbar">
    <b-navbar toggleable="lg" type="light" variant="trans">
      <div class="navbar-brand">
        <b-navbar-nav>
          <b-nav-item to="/overview">
            <img :src="logo" class="navbar-brand-img" alt="..." />
          </b-nav-item>
        </b-navbar-nav>
      </div>
      <b-nav-text center>{{ balance }} GDD</b-nav-text>

      <div class="d-flex d-xl-none d-lg-none d-md-flex">
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item to="/overview" class="test-overview">{{ $t('overview') }}</b-nav-item>
            <b-nav-item to="/send">{{ $t('send') }}</b-nav-item>
            <b-nav-item to="/transactions">{{ $t('transactions') }}</b-nav-item>
            <b-nav-item to="/profile">{{ $t('site.navbar.my-profil') }}</b-nav-item>
            <hr />
            <b-nav-item class="mb-3" @click="$emit('get-elopage-link')">
              {{ $t('members_area') }}
              <b-badge v-if="!$store.state.hasElopage" pill variant="danger">!</b-badge>
            </b-nav-item>
            <b-nav-item
              v-if="$store.state.isAdmin"
              class="test-overview mb-3"
              @click="$emit('admin')"
            >
              {{ $t('admin_area') }}
            </b-nav-item>
            <b-nav-item class="mb-3" @click="$emit('logout')">
              {{ $t('logout') }}
            </b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </div>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    </b-navbar>
  </div>
</template>
<script>
export default {
  name: 'navbar',
  props: {
    balance: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      logo: 'img/brand/green.png',
    }
  },
}
</script>
