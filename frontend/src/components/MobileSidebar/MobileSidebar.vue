<template>
  <div>
    <b-sidebar
      id="sidebar-mobile"
      sidebar-class="sidebar-radius"
      width="220px"
      :backdrop="true"
      bg-variant="white"
      no-header-close
    >
      <b-img src="img/svg/lines.png" />
      <div class="px-3 py-2">
        <sidebar @admin="$emit('admin')" @logout="$emit('logout')" :shadow="false" />
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
<style>
.sidebar-radius {
  border-bottom-right-radius: 26px;
  border-top-right-radius: 26px;
}
</style>
