<template>
  <BCollapse
    id="sidebar-mobile"
    sidebar-class="sidebar-radius"
    :backdrop="true"
    bg-variant="white"
    no-header-close
    horizontal
    skip-animation
    :model-value="isMobileMenuOpen"
    @update:model-value="isMobileMenuOpen = $event"
  >
    <div class="mobile-sidebar-wrapper py-2">
      <BImg src="img/svg/lines.png" />
      <sidebar
        :shadow="false"
        @admin="emit('admin')"
        @close-sidebar="closeMenu"
        @logout="emit('logout')"
      />
    </div>
    <div v-b-toggle.sidebar-mobile class="simple-overlay" />
  </BCollapse>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { lock, unlock } from 'tua-body-scroll-lock'

const isMobileMenuOpen = ref(false)

const emit = defineEmits(['admin', 'logout'])

const closeMenu = () => {
  isMobileMenuOpen.value = false
}

watch(
  () => isMobileMenuOpen.value,
  (newVal) => {
    if (newVal) {
      lock()
    } else {
      unlock()
    }
  },
)

onUnmounted(() => {
  unlock()
})
</script>

<style>
.mobile-sidebar-wrapper {
  width: 220px;
  background-color: #fff;
  z-index: 1001;
  position: absolute;
  border-bottom-right-radius: 26px;
  border-top-right-radius: 26px;
  top: 0;
  bottom: 0;
}

#sidebar-mobile {
  width: 220px;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1001;
}

.simple-overlay {
  position: absolute;
  left: 200px;
  top: 0;
  bottom: 0;
  background-color: #212529;
  z-index: 99;
  opacity: 0.6;
  width: calc(100vw - 200px);
}
</style>
