<template>
  <div id="component-sidebar">
    <div class="px-3 py-2">
      <p></p>
      <div class="mb-6">
        <b-nav vertical class="w-200">
          <b-nav-item to="/overview" class="mb-3" active>{{ $t('overview') }}</b-nav-item>
          <b-nav-item to="/send" class="mb-3">{{ $t('send') }}</b-nav-item>
          <b-nav-item to="/transactions" class="mb-3">{{ $t('transactions') }}</b-nav-item>
          <b-nav-item to="/profile" class="mb-3">
            <b-icon icon="gear-fill" aria-hidden="true"></b-icon>
            {{ $t('site.navbar.my-profil') }}
          </b-nav-item>
        </b-nav>
        <hr />
        <b-nav vertical class="w-100">
          <b-nav-item class="mb-3" :href="elopageUri" target="_blank">
            <b-icon icon="link45deg" aria-hidden="true"></b-icon>
            {{ $t('members_area') }}
            <b-badge v-if="!$store.state.hasElopage" pill variant="danger">!</b-badge>
          </b-nav-item>
          <b-nav-item class="mb-3" v-if="$store.state.isAdmin" @click="$emit('admin')">
            <b-icon icon="link45deg" aria-hidden="true"></b-icon>
            {{ $t('admin_area') }}
          </b-nav-item>
          <b-nav-item class="mb-3" @click="$emit('logout')">
            <b-icon icon="power" aria-hidden="true"></b-icon>
            {{ $t('logout') }}
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
