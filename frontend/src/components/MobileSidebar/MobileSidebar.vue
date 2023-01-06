<template>
  <div>
    <b-sidebar id="sidebar-mobile" bg-variant="f5" :backdrop="true">
      <div class="px-3 py-2">
        <sidebar @admin="$emit('admin')" @logout="$emit('logout')" />
      </div>
      <template #header>
        <div>
          <div class="mr-auto">{{ avatarLongName }}</div>
          <div class="small">
            <small>{{ $store.state.email }}</small>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="d-flex bg-light">
          <strong class="mr-auto p-2">{{ $t('send_gdd') }}</strong>
          <b-button to="/send"><b-icon icon="arrow-right"></b-icon></b-button>
        </div>
      </template>
    </b-sidebar>
  </div>
</template>
<script>
import Sidebar from '@/components/Menu/Sidebar.vue'

export default {
  name: 'MobileSidebar',
  components: {
    Sidebar,
  },
  computed: {
    avatarLongName() {
      return `${this.$store.state.firstName} ${this.$store.state.lastName}`
    },
  },
}
</script>
