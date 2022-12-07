<template>
  <div>
    <b-sidebar id="sidebar-1" no-header bg-variant="white" :backdrop="true">
      <div class="px-3 py-2">
        <sidebar @admin="$emit('admin')" @logout="$emit('logout')" />
      </div>
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
}
</script>
