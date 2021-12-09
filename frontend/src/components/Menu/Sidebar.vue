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
            {{ $t('site.navbar.my-profil') }}
          </b-nav-item>
        </b-nav>
        <hr />
        <b-nav vertical class="w-100">
          <b-nav-item class="mb-3" @click="$emit('get-elopage-link')">
            {{ $t('members_area') }}
            <b-badge v-if="!$store.state.hasElopage" pill variant="danger">!</b-badge>
          </b-nav-item>
          <b-nav-item class="mb-3" v-if="$store.state.isAdmin" @click="$emit('admin')">
            {{ $t('admin_area') }}
          </b-nav-item>
          <b-nav-item class="mb-3" @click="$emit('logout')">{{ $t('logout') }}</b-nav-item>
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
