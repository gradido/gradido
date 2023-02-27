<template>
  <div>
    <b-sidebar id="sidebar-mobile" :backdrop="true" bg-variant="transparent">
      <div class="px-3 py-2">
        <sidebar @admin="$emit('admin')" @logout="$emit('logout')" :shadow="false" />
      </div>
    </b-sidebar>
  </div>
</template>
<script>
import Sidebar from '@/components/Menu/Sidebar'

export default {
  name: 'MobileSidebar',
  components: {
    Sidebar,
  },
}
</script>
