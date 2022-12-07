<template>
  <div>
    <b-sidebar id="sidebar-mobile" bg-variant="white" :backdrop="true">
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
